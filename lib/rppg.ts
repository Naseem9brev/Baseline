// ─────────────────────────────────────────────────────────────────────────────
// rPPG (remote photoplethysmography) — estimate heart rate from a face skin ROI's
// green-channel colour fluctuations over time. Pure, dependency-free, unit-testable.
//
// Pipeline (kept deliberately simple per the review — green channel + FFT, no POS):
//   resample to uniform grid → detrend → z-normalize → Hann window → FFT →
//   peak in 0.7–4 Hz band → bpm; peak-vs-band-noise → confidence.
//
// Realistic accuracy: ±2–3 bpm ideal, ±5–10 bpm in real conditions. NOT medical-grade.
// Reference method: phoboslab/webcam-pulse; validation context PMC11362249.
// ─────────────────────────────────────────────────────────────────────────────

export interface HeartRateResult {
  bpm: number;
  confidence: number; // 0..1
  valid: boolean; // false if not enough usable signal
}

const FS = 30; // target uniform sample rate (Hz)
const BAND_LO = 0.7; // Hz → 42 bpm
const BAND_HI = 4.0; // Hz → 240 bpm
const MIN_SAMPLES = 64;

/** Estimate heart rate from timestamped green-channel means. `times` in ms, ascending. */
export function estimateHeartRate(times: number[], green: number[]): HeartRateResult {
  if (times.length < 2 || green.length !== times.length) {
    return { bpm: 0, confidence: 0, valid: false };
  }

  let sig = resampleUniform(times, green, FS);
  if (sig.length < MIN_SAMPLES) return { bpm: 0, confidence: 0, valid: false };

  sig = detrend(sig);
  // High-pass: subtract a moving average (~1/BAND_LO window) to remove breathing
  // and slow lighting drift, which otherwise leak into the low edge of the band
  // and cause false ~40 bpm reads.
  sig = highpassMovingAverage(sig, Math.round(FS / BAND_LO) | 1);
  sig = zscore(sig);
  sig = hann(sig);

  const N = Math.max(1024, nextPow2(sig.length));
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  for (let i = 0; i < sig.length; i++) re[i] = sig[i];
  fft(re, im);

  const half = N >> 1;
  const freqRes = FS / N;
  const mags = new Float64Array(half);
  for (let i = 0; i < half; i++) mags[i] = Math.hypot(re[i], im[i]);

  const lo = Math.max(1, Math.floor(BAND_LO / freqRes));
  const hi = Math.min(half - 2, Math.ceil(BAND_HI / freqRes));

  // Pick the strongest *local* maximum in band — avoids latching onto a monotonic
  // rise into the band edge (the cause of false ~40 bpm reads).
  let peakIdx = -1;
  let peakMag = -1;
  for (let i = lo; i <= hi; i++) {
    const m = mags[i];
    if (m > mags[i - 1] && m >= mags[i + 1] && m > peakMag) {
      peakMag = m;
      peakIdx = i;
    }
  }
  if (peakIdx < 0) {
    // fallback: in-band max excluding the boundary bins
    for (let i = lo + 1; i < hi; i++) {
      if (mags[i] > peakMag) {
        peakMag = mags[i];
        peakIdx = i;
      }
    }
  }
  if (peakIdx < 0) return { bpm: 0, confidence: 0, valid: false };

  // Quadratic (parabolic) interpolation around the peak for sub-bin precision.
  const a = mags[peakIdx - 1];
  const b = mags[peakIdx];
  const c = mags[peakIdx + 1];
  const denom = a - 2 * b + c;
  const delta = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
  const bpm = Math.round((peakIdx + delta) * freqRes * 60);

  // Confidence = peak prominence vs the band's median noise floor.
  const bandMags: number[] = [];
  for (let i = lo; i <= hi; i++) bandMags.push(mags[i]);
  bandMags.sort((x, y) => x - y);
  const median = bandMags[Math.floor(bandMags.length / 2)] || 1e-9;
  const snr = peakMag / median;
  const confidence = clamp01((snr - 2) / 4); // snr<=2 → 0, snr>=6 → 1

  return { bpm, confidence, valid: true };
}

// ── DSP helpers ──────────────────────────────────────────────────────────────

/** Linear-interpolate an irregular series onto a uniform grid at `fs` Hz. */
export function resampleUniform(t: number[], v: number[], fs: number): number[] {
  const dt = 1000 / fs;
  const start = t[0];
  const end = t[t.length - 1];
  const out: number[] = [];
  let j = 0;
  for (let tt = start; tt <= end; tt += dt) {
    while (j < t.length - 2 && t[j + 1] < tt) j++;
    const t0 = t[j];
    const t1 = t[j + 1] ?? t0;
    const v0 = v[j];
    const v1 = v[j + 1] ?? v0;
    const frac = t1 > t0 ? (tt - t0) / (t1 - t0) : 0;
    out.push(v0 + (v1 - v0) * frac);
  }
  return out;
}

/** Remove the linear trend (least-squares) — kills slow lighting drift + DC. */
export function detrend(x: number[]): number[] {
  const n = x.length;
  if (n < 2) return x.slice();
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i;
    sy += x[i];
    sxx += i * i;
    sxy += i * x[i];
  }
  const d = n * sxx - sx * sx;
  const slope = d !== 0 ? (n * sxy - sx * sy) / d : 0;
  const intercept = (sy - slope * sx) / n;
  return x.map((val, i) => val - (slope * i + intercept));
}

/** High-pass by subtracting a centered moving average (O(n) via prefix sums). */
function highpassMovingAverage(x: number[], win: number): number[] {
  const n = x.length;
  const half = Math.floor(win / 2);
  const pre = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + x[i];
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - half);
    const b = Math.min(n - 1, i + half);
    out[i] = x[i] - (pre[b + 1] - pre[a]) / (b - a + 1);
  }
  return out;
}

function zscore(x: number[]): number[] {
  const n = x.length;
  const mean = x.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(x.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1;
  return x.map((v) => (v - mean) / sd);
}

function hann(x: number[]): number[] {
  const n = x.length;
  if (n < 2) return x.slice();
  return x.map((v, i) => v * 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1))));
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** In-place iterative radix-2 Cooley–Tukey FFT. `re`/`im` length must be a power of 2. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cwr = 1;
      let cwi = 0;
      for (let k = 0; k < len >> 1; k++) {
        const a = i + k;
        const b = a + (len >> 1);
        const tr = cwr * re[b] - cwi * im[b];
        const ti = cwr * im[b] + cwi * re[b];
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
        const ncwr = cwr * wr - cwi * wi;
        cwi = cwr * wi + cwi * wr;
        cwr = ncwr;
      }
    }
  }
}
