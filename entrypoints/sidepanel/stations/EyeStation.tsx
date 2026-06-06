import { useEffect, useRef, useState } from 'react';
import { getFaceLandmarker } from '@/lib/mediapipe';
import { openCameraPermissionTab } from '@/lib/cameraPermission';
import {
  blinkRate,
  countBlinks,
  eyeAspectRatio,
  foreheadROI,
  meanRGB,
} from '@/lib/eyeMetrics';
import { estimateHeartRate } from '@/lib/rppg';
import { getVitalLensApiKey } from '@/lib/settings';
import {
  estimateHeartRateVitalLens,
  VL_FRAME_BYTES,
  VL_SIZE,
} from '@/lib/vitallens';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

/** Result emitted to the check-in flow. Camera-only station. */
export interface EyeResult {
  heartRateBpm: number;
  hrConfidence: number; // 0..1
  blinkRate: number; // blinks/min
  cameraUsed: true;
}

const CAPTURE_MS = 10_000; // ~10s is plenty for a stable HR estimate
const MIN_VALID_MS = 6_000;
const MIN_FACE_FRAMES = 60; // ~face present for the bulk of the capture
const CONF_GATE = 0.4; // below → don't show a number
const CONF_LOW = 0.6; // below → show but flag "low confidence"
const ROI_SHIFT_GATE = 0.3; // drop frames whose ROI brightness jumps >30%

const MIN_VL_FRAMES = 60; // enough frames for a VitalLens estimate

type Phase = 'init' | 'capturing' | 'analyzing' | 'result';

interface Computed {
  result: EyeResult;
  status: 'good' | 'low' | 'retry';
  band: number; // ± bpm
  debug: {
    elapsedSec: number;
    faceFrames: number;
    greenSamples: number;
    trackEnded: boolean;
    source: 'vitallens' | 'on-device';
  };
}

export default function EyeStation({
  onComplete,
  onError,
}: {
  onComplete: (r: EyeResult) => void;
  onError: (kind: 'denied' | 'error') => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('init');
  const [remaining, setRemaining] = useState(Math.ceil(CAPTURE_MS / 1000));
  const [computed, setComputed] = useState<Computed | null>(null);
  const [attempt, setAttempt] = useState(0); // bump to restart capture
  const [failMsg, setFailMsg] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    let disposed = false;

    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true })!;

    // 40×40 face crop for VitalLens cloud rPPG (only collected when a key is set).
    const vlCanvas = document.createElement('canvas');
    vlCanvas.width = VL_SIZE;
    vlCanvas.height = VL_SIZE;
    const vlCtx = vlCanvas.getContext('2d', { willReadFrequently: true })!;
    const vlFrames: Uint8Array[] = [];
    let useVitalLens = false;

    const times: number[] = [];
    const greens: number[] = [];
    const earSeries: number[] = [];
    let runningGreen = 0;
    let faceFrames = 0;
    let trackEnded = false;

    const constraints: MediaStreamConstraints = {
      video: { width: 640, height: 480 },
      audio: false,
    };

    async function run() {
      useVitalLens = !!(await getVitalLensApiKey());
      if (cancelled) return;
      console.log('[Eye] VitalLens key present:', useVitalLens);

      // Try the camera DIRECTLY first. If it's already granted this returns a live
      // track without opening the permission helper tab — whose camera use was
      // ending the side-panel track (state "ended", 2x2).
      try {
        console.log('[Eye] requesting getUserMedia…');
        stream = await withTimeout(
          navigator.mediaDevices.getUserMedia(constraints),
          6_000,
        );
        console.log('[Eye] camera stream acquired directly');
      } catch (e) {
        if (cancelled) return;
        const name = (e as DOMException)?.name;
        console.warn('[Eye] direct getUserMedia failed:', name);
        if (name && name !== 'NotAllowedError' && name !== 'NotFoundError') {
          setFailMsg(`Couldn’t start the camera (${name}).`);
          return;
        }
        // Not granted (or it hung): grant via the helper tab, wait for it to fully
        // release the camera, then retry directly.
        const granted = await openCameraPermissionTab();
        if (cancelled) return;
        if (!granted) {
          onError('denied');
          return;
        }
        await delay(1500);
        if (cancelled) return;
        try {
          stream = await withTimeout(
            navigator.mediaDevices.getUserMedia(constraints),
            8_000,
          );
          console.log('[Eye] camera stream acquired after grant');
        } catch {
          if (!cancelled) {
            setFailMsg(
              'Couldn’t start the camera after granting access. Close any other camera apps/tabs and try again.',
            );
          }
          return;
        }
      }
      if (cancelled) return;

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch((e) => console.warn('[Eye] video.play() rejected', e));
      const track = stream.getVideoTracks()[0];
      console.log('[Eye] track:', track?.label, '| state:', track?.readyState);
      track?.addEventListener('ended', () => {
        trackEnded = true;
        console.warn('[Eye] ⚠ video track ENDED early (side-panel camera dropped)');
      });

      // Wait until the camera actually delivers frames before the timed capture —
      // otherwise the clock runs over a black feed and yields 0 frames.
      const gotFrame = await waitForVideoFrame(video, 8_000);
      if (cancelled) return;
      console.log('[Eye] first frame?', gotFrame, video.videoWidth, 'x', video.videoHeight);
      if (!gotFrame) {
        console.error('[Eye] camera delivered no frames (device busy?)');
        setFailMsg(
          `Camera sent no video (track muted: ${track?.muted}, state: ${track?.readyState}, size: ${video.videoWidth}x${video.videoHeight}). The camera works in a normal tab but not the side panel — likely a side-panel capture limitation.`,
        );
        return;
      }

      let landmarker;
      try {
        console.log('[Eye] loading FaceLandmarker model…');
        landmarker = await withTimeout(getFaceLandmarker(), 20_000);
        console.log('[Eye] model ready');
      } catch (err) {
        console.error('[Eye] model load failed:', err);
        if (!cancelled)
          setFailMsg('The face model failed to load — reload the extension and try again.');
        return;
      }
      if (cancelled) return;

      setPhase('capturing');
      const start = performance.now();
      const overlay = overlayRef.current!;
      const octx = overlay.getContext('2d')!;

      const loop = () => {
        if (cancelled) return;
        const now = performance.now();
        const elapsed = now - start;
        setRemaining(Math.max(0, Math.ceil((CAPTURE_MS - elapsed) / 1000)));

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (vw > 0) {
          if (sampleCanvas.width !== vw) {
            console.log('[Eye] first frames', vw, 'x', vh, '| track', video.srcObject && (video.srcObject as MediaStream).getVideoTracks()[0]?.readyState);
            sampleCanvas.width = vw;
            sampleCanvas.height = vh;
            overlay.width = vw;
            overlay.height = vh;
          }
          const res = landmarker!.detectForVideo(video, now);
          octx.clearRect(0, 0, vw, vh);
          const face = res.faceLandmarks?.[0];
          if (face) {
            faceFrames++;
            earSeries.push(eyeAspectRatio(face));

            // VitalLens: collect a 40×40 face crop per frame.
            if (useVitalLens) {
              const bb = faceBBox(face, vw, vh);
              vlCtx.drawImage(video, bb.sx, bb.sy, bb.sw, bb.sh, 0, 0, VL_SIZE, VL_SIZE);
              const d = vlCtx.getImageData(0, 0, VL_SIZE, VL_SIZE).data;
              const frame = new Uint8Array(VL_FRAME_BYTES);
              for (let i = 0, j = 0; i < d.length; i += 4) {
                frame[j++] = d[i];
                frame[j++] = d[i + 1];
                frame[j++] = d[i + 2];
              }
              vlFrames.push(frame);
            }

            const roi = foreheadROI(face, vw, vh);
            if (roi.w > 0 && roi.h > 0) {
              sampleCtx.drawImage(video, 0, 0, vw, vh);
              const px = sampleCtx.getImageData(roi.x, roi.y, roi.w, roi.h).data;
              const g = meanRGB(px).g;
              // frame-gate: skip lighting/motion jumps
              const jump =
                runningGreen > 0 ? Math.abs(g - runningGreen) / runningGreen : 0;
              if (runningGreen === 0 || jump <= ROI_SHIFT_GATE) {
                times.push(now);
                greens.push(g);
                runningGreen =
                  runningGreen === 0 ? g : runningGreen * 0.9 + g * 0.1;
              }
              // draw ROI box
              octx.strokeStyle = '#22d3ee';
              octx.lineWidth = 3;
              octx.strokeRect(roi.x, roi.y, roi.w, roi.h);
            }
          }
        }

        if (elapsed >= CAPTURE_MS) {
          void finish(elapsed);
          return;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    async function finish(elapsedMs: number) {
      const blinks = countBlinks(earSeries);
      const bpmRate = blinkRate(blinks, elapsedMs);
      const enoughTime = elapsedMs >= MIN_VALID_MS;
      const enoughFace = faceFrames >= MIN_FACE_FRAMES;

      // On-device estimate (always computed as the fallback).
      const local = estimateHeartRate(times, greens);
      let bpm = local.bpm;
      let confidence = local.confidence;
      let valid = local.valid;
      let source: 'vitallens' | 'on-device' = 'on-device';

      // VitalLens cloud estimate — preferred when a key is set + enough frames.
      if (useVitalLens && vlFrames.length >= MIN_VL_FRAMES) {
        stopCapture(); // free the camera while we call the API
        setPhase('analyzing');
        const fps = vlFrames.length / (elapsedMs / 1000);
        const bytes = new Uint8Array(vlFrames.length * VL_FRAME_BYTES);
        vlFrames.forEach((f, i) => bytes.set(f, i * VL_FRAME_BYTES));
        const vl = await estimateHeartRateVitalLens(bytes, fps);
        if (disposed) return;
        if (vl && vl.faceDetected && vl.bpm > 0) {
          bpm = vl.bpm;
          confidence = vl.confidence;
          valid = true;
          source = 'vitallens';
        }
      } else {
        stopCapture();
      }

      console.log('[Eye] finish:', {
        source,
        elapsedSec: Math.round(elapsedMs / 1000),
        faceFrames,
        greenSamples: greens.length,
        vlFrames: vlFrames.length,
        bpm,
        confidence: Number(confidence.toFixed(2)),
      });

      const ok = enoughTime && enoughFace && valid && confidence >= CONF_GATE;
      const result: EyeResult = {
        heartRateBpm: ok ? bpm : 0,
        hrConfidence: confidence,
        blinkRate: Math.round(bpmRate),
        cameraUsed: true,
      };
      const status: Computed['status'] = !ok
        ? 'retry'
        : confidence < CONF_LOW
          ? 'low'
          : 'good';
      const band = confidence >= CONF_LOW ? 3 : 5;

      if (disposed) return;
      setComputed({
        result,
        status,
        band,
        debug: {
          elapsedSec: Math.round(elapsedMs / 1000),
          faceFrames,
          greenSamples: greens.length,
          trackEnded,
          source,
        },
      });
      setPhase('result');
    }

    function stopCapture() {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    }

    run();
    return () => {
      disposed = true;
      stopCapture();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  if (failMsg) {
    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-sm font-medium text-amber-800">
          Eye check couldn’t start
        </p>
        <p className="text-xs text-amber-700">{failMsg}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFailMsg(null);
              setComputed(null);
              setPhase('init');
              setRemaining(Math.ceil(CAPTURE_MS / 1000));
              setAttempt((a) => a + 1);
            }}
            className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Try again
          </button>
          <button
            onClick={() => onError('error')}
            className="flex-1 rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result' && computed) {
    return (
      <ResultCard
        c={computed}
        onRetry={() => {
          setComputed(null);
          setPhase('init');
          setRemaining(Math.ceil(CAPTURE_MS / 1000));
          setAttempt((a) => a + 1);
        }}
        onSave={() => onComplete(computed.result)}
        onSkip={() => onError('error')}
      />
    );
  }

  if (phase === 'analyzing') {
    return (
      <div className="grid place-items-center gap-3 rounded-xl bg-slate-900 py-14 text-center">
        <Spinner />
        <p className="text-sm text-white">Analyzing heart rate…</p>
        <p className="text-[11px] text-white/60">
          Estimating from your face via VitalLens.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-900">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <canvas
          ref={overlayRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        {phase === 'init' && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/80 text-center text-sm text-white">
            <div>
              <Spinner />
              <p className="mt-2">Starting camera + model…</p>
            </div>
          </div>
        )}
        {phase === 'capturing' && (
          <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
            {remaining}s
          </div>
        )}
      </div>
      <p className="text-center text-sm text-slate-600">
        {phase === 'init'
          ? 'Allow camera access to begin.'
          : 'Hold still, face steady light, look at the camera…'}
      </p>
      <p className="text-center text-[11px] text-slate-400">
        Reading heart rate from facial colour + blink rate. Nothing is recorded.
      </p>
    </div>
  );
}

function ResultCard({
  c,
  onRetry,
  onSave,
  onSkip,
}: {
  c: Computed;
  onRetry: () => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  if (c.status === 'retry') {
    return (
      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
        <p className="text-sm font-medium text-amber-800">
          Couldn’t get a clean read.
        </p>
        <p className="text-xs text-amber-700">
          Sit still, face steady overhead light, and avoid moving for the count.
        </p>
        <DebugLine d={c.debug} />
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Try again
          </button>
          <button
            onClick={onSkip}
            className="flex-1 rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  const { result, band } = c;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Heart rate {c.status === 'low' && '· low confidence'}
        </p>
        <p className="mt-1 text-3xl font-bold text-teal-700">
          ≈{result.heartRateBpm}
          <span className="text-base font-medium text-slate-400">
            {' '}
            ±{band} bpm
          </span>
        </p>
        <p className="text-[11px] text-slate-400">estimate</p>

        <div className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
          Blink rate <span className="font-semibold">{result.blinkRate}</span>/min
        </div>
      </div>

      <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
        Estimated from facial colour — not medical-grade. One reading isn’t a
        baseline; lighting, movement, caffeine and more affect it. If you feel
        unwell, trust your symptoms over this number.
      </p>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Save & continue
        </button>
        <button
          onClick={onRetry}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

/** On-screen diagnostics so issues are visible without DevTools. */
function DebugLine({ d }: { d: Computed['debug'] }) {
  return (
    <p className="font-mono text-[10px] text-slate-400">
      diag · {d.source} · {d.elapsedSec}s · frames {d.faceFrames} · samples{' '}
      {d.greenSamples} · track {d.trackEnded ? 'ENDED early ⚠' : 'ok'}
    </p>
  );
}

/**
 * Resolve true once a *real* video frame has been presented (not just metadata),
 * else false on timeout. `requestVideoFrameCallback` only fires for actual painted
 * frames, so a black/empty feed (camera busy) correctly times out.
 */
function waitForVideoFrame(video: HTMLVideoElement, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: boolean) => {
      if (done) return;
      done = true;
      window.clearInterval(iv);
      window.clearTimeout(to);
      resolve(v);
    };
    const vfc = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };
    if (typeof vfc.requestVideoFrameCallback === 'function') {
      vfc.requestVideoFrameCallback(() => finish(true));
    }
    // Fallback / corroboration: currentTime only advances when frames actually play.
    const iv = window.setInterval(() => {
      if (video.videoWidth > 0 && video.currentTime > 0) finish(true);
    }, 150);
    const to = window.setTimeout(() => finish(false), ms);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Reject if a promise doesn't settle in time — guards against a stuck camera open. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      window.setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ]);
}

/** Face bounding box (source-rect in video pixels) from landmarks, padded ~10%. */
function faceBBox(
  face: NormalizedLandmark[],
  w: number,
  h: number,
): { sx: number; sy: number; sw: number; sh: number } {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of face) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const padX = (maxX - minX) * 0.1;
  const padY = (maxY - minY) * 0.1;
  const x0 = Math.max(0, minX - padX);
  const y0 = Math.max(0, minY - padY);
  const x1 = Math.min(1, maxX + padX);
  const y1 = Math.min(1, maxY + padY);
  return {
    sx: x0 * w,
    sy: y0 * h,
    sw: (x1 - x0) * w,
    sh: (y1 - y0) * h,
  };
}
