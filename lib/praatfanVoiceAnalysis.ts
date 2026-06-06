/**
 * Sustained /a/ analysis using praatfan WASM (Praat-equivalent pitch + HNR)
 * plus Praat-style local jitter/shimmer from the pitch track and waveform.
 *
 * NHS SLT sustained vowel task — for longitudinal tracking, not diagnosis.
 */

import initPraatfan, { Sound } from '@/vendor/praatfan-wasm/praatfan_rust.js';

/** Praat Voice report defaults for adult sustained vowels. */
const PITCH_FLOOR = 75;
const PITCH_CEILING = 500;
const HNR_TIME_STEP = 0.01;
const HNR_MIN_PITCH = 75;
const HNR_SILENCE_THRESHOLD = 0.1;
const HNR_PERIODS_PER_WINDOW = 4.5;
const MIN_VOICED_PERIODS = 8;

export interface VoiceAnalysisResult {
  /** Praat local jitter (%). NHS ref: <0.5 normal, >2 flagged. */
  jitter: number;
  /** Praat local shimmer (%). NHS ref: <5 normal, >12 flagged. */
  shimmer: number;
  /** Mean HNR (dB) over stable voiced segment. NHS ref: >20 normal, <12 flagged. */
  hnr: number;
  /** Maximum phonation time — full recording duration (seconds). NHS ref: ~22s healthy 60–80yo. */
  mptSec: number;
  /** Alias kept for existing storage shape. */
  durationSec: number;
}

let initPromise: Promise<void> | null = null;

/** Stable extension URL — avoids broken /assets/… resolution in WXT dev side panel. */
const PRAATFAN_WASM_URL = chrome.runtime.getURL('praatfan/praatfan_rust_bg.wasm');

async function ensurePraatfan(): Promise<void> {
  if (!initPromise) {
    initPromise = initPraatfan(PRAATFAN_WASM_URL)
      .then(() => undefined)
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  await initPromise;
}

/** Trim unstable onset/offset (SLT protocol: discard ~0.5s each end when possible). */
export function trimStableSegment(
  samples: Float32Array | Float64Array,
  sampleRate: number,
): Float64Array {
  const n = samples.length;
  const trim = Math.min(Math.floor(0.5 * sampleRate), Math.floor(n * 0.12));
  if (n - 2 * trim >= sampleRate * 0.8) {
    return Float64Array.from(samples.subarray(trim, n - trim));
  }
  const keep = Math.floor(n * 0.7);
  const offset = Math.floor((n - keep) / 2);
  return Float64Array.from(samples.subarray(offset, offset + keep));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Praat local jitter: mean |Ti - Ti+1| / mean(Ti) × 100 */
function localJitter(periodsSec: number[]): number | null {
  if (periodsSec.length < 2) return null;
  const meanP = periodsSec.reduce((a, b) => a + b, 0) / periodsSec.length;
  if (meanP <= 0) return null;
  let sumDiff = 0;
  for (let i = 1; i < periodsSec.length; i++) {
    sumDiff += Math.abs(periodsSec[i]! - periodsSec[i - 1]!);
  }
  return (sumDiff / (periodsSec.length - 1) / meanP) * 100;
}

/** Praat local shimmer: mean |Ai - Ai+1| / mean(Ai) × 100 */
function localShimmer(amplitudes: number[]): number | null {
  if (amplitudes.length < 2) return null;
  const meanA = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
  if (meanA <= 0) return null;
  let sumDiff = 0;
  for (let i = 1; i < amplitudes.length; i++) {
    sumDiff += Math.abs(amplitudes[i]! - amplitudes[i - 1]!);
  }
  return (sumDiff / (amplitudes.length - 1) / meanA) * 100;
}

function meanHnrDb(hnrValues: Float64Array): number | null {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < hnrValues.length; i++) {
    const v = hnrValues[i]!;
    // praatfan uses -200 for silent/unvoiced frames
    if (v > -50) {
      sum += v;
      count++;
    }
  }
  return count > 0 ? sum / count : null;
}

function peakAmplitudePerPeriod(
  samples: Float64Array,
  sampleRate: number,
  times: Float64Array,
  f0: Float64Array,
): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < f0.length; i++) {
    const freq = f0[i]!;
    if (Number.isNaN(freq) || freq <= 0) continue;
    const periodSamples = Math.max(8, Math.round(sampleRate / freq));
    const center = Math.round(times[i]! * sampleRate);
    const start = Math.max(0, center - Math.floor(periodSamples / 2));
    const end = Math.min(samples.length, start + periodSamples);
    let peak = 0;
    for (let j = start; j < end; j++) {
      const v = Math.abs(samples[j]!);
      if (v > peak) peak = v;
    }
    if (peak > 0) peaks.push(peak);
  }
  return peaks;
}

export function mergeSampleChunks(chunks: Float32Array[]): Float32Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

/**
 * Analyze a sustained /a/ recording. Audio stays in memory only; returns numeric metrics.
 */
export async function analyzeSustainedVowel(
  samples: Float32Array,
  sampleRate: number,
  mptSec: number,
): Promise<VoiceAnalysisResult | null> {
  await ensurePraatfan();

  const trimmed = trimStableSegment(samples, sampleRate);
  const f64 = trimmed;

  const sound = new Sound(f64, sampleRate);
  try {
    // CC pitch — Praat uses cross-correlation for periodic point marking
    const pitch = sound.to_pitch_cc(0, PITCH_FLOOR, PITCH_CEILING);
    try {
      const harmonicity = sound.to_harmonicity_ac(
        HNR_TIME_STEP,
        HNR_MIN_PITCH,
        HNR_SILENCE_THRESHOLD,
        HNR_PERIODS_PER_WINDOW,
      );
      try {
        const f0 = pitch.values();
        const times = pitch.times();
        const periodsSec: number[] = [];
        for (let i = 0; i < f0.length; i++) {
          const freq = f0[i]!;
          if (!Number.isNaN(freq) && freq > 0) periodsSec.push(1 / freq);
        }

        if (periodsSec.length < MIN_VOICED_PERIODS) return null;

        const jitter = localJitter(periodsSec);
        const amplitudes = peakAmplitudePerPeriod(f64, sampleRate, times, f0);
        const shimmer = localShimmer(amplitudes);
        const hnr = meanHnrDb(harmonicity.values());

        if (jitter === null || shimmer === null || hnr === null) return null;

        const mpt = round2(mptSec);
        return {
          jitter: round2(jitter),
          shimmer: round2(shimmer),
          hnr: round2(hnr),
          mptSec: mpt,
          durationSec: mpt,
        };
      } finally {
        harmonicity.free();
      }
    } finally {
      pitch.free();
    }
  } finally {
    sound.free();
  }
}
