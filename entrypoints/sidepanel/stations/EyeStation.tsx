import { useEffect, useRef, useState } from 'react';
import { getFaceLandmarker } from '@/lib/mediapipe';
import { ensureCameraPermission } from '@/lib/cameraPermission';
import {
  blinkRate,
  countBlinks,
  eyeAspectRatio,
  foreheadROI,
  meanRGB,
} from '@/lib/eyeMetrics';
import { estimateHeartRate } from '@/lib/rppg';

/** Result emitted to the check-in flow. Camera-only station. */
export interface EyeResult {
  heartRateBpm: number;
  hrConfidence: number; // 0..1
  blinkRate: number; // blinks/min
  cameraUsed: true;
}

const CAPTURE_MS = 20_000;
const MIN_VALID_MS = 15_000;
const MIN_FACE_FRAMES = 150; // ~5s of detected face
const CONF_GATE = 0.4; // below → don't show a number
const CONF_LOW = 0.6; // below → show but flag "low confidence"
const ROI_SHIFT_GATE = 0.3; // drop frames whose ROI brightness jumps >30%

type Phase = 'init' | 'capturing' | 'result';

interface Computed {
  result: EyeResult;
  status: 'good' | 'low' | 'retry';
  band: number; // ± bpm
  debug: {
    elapsedSec: number;
    faceFrames: number;
    greenSamples: number;
    trackEnded: boolean;
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

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true })!;

    const times: number[] = [];
    const greens: number[] = [];
    const earSeries: number[] = [];
    let runningGreen = 0;
    let faceFrames = 0;
    let trackEnded = false;

    async function run() {
      // Side panels can't show the camera prompt — grant once via a helper tab if needed.
      const permitted = await ensureCameraPermission();
      if (cancelled) return;
      console.log('[Eye] camera permission:', permitted);
      if (!permitted) {
        onError('denied');
        return;
      }

      try {
        console.log('[Eye] requesting getUserMedia…');
        stream = await withTimeout(
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 },
            audio: false,
          }),
          12_000,
        );
        console.log('[Eye] camera stream acquired');
      } catch (e) {
        console.error('[Eye] getUserMedia failed:', e);
        if (!cancelled) {
          onError((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'error');
        }
        return;
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

      let landmarker;
      try {
        console.log('[Eye] loading FaceLandmarker model…');
        landmarker = await withTimeout(getFaceLandmarker(), 20_000);
        console.log('[Eye] model ready');
      } catch (err) {
        console.error('[Eye] model load failed:', err);
        if (!cancelled) onError('error');
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
          finish(elapsed);
          return;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function finish(elapsedMs: number) {
      const hr = estimateHeartRate(times, greens);
      const blinks = countBlinks(earSeries);
      const bpmRate = blinkRate(blinks, elapsedMs);
      console.log('[Eye] finish:', {
        elapsedSec: Math.round(elapsedMs / 1000),
        faceFrames,
        greenSamples: greens.length,
        bpm: hr.bpm,
        confidence: Number(hr.confidence.toFixed(2)),
      });

      const enoughTime = elapsedMs >= MIN_VALID_MS;
      const enoughFace = faceFrames >= MIN_FACE_FRAMES;
      const ok = enoughTime && enoughFace && hr.valid && hr.confidence >= CONF_GATE;

      const result: EyeResult = {
        heartRateBpm: ok ? hr.bpm : 0,
        hrConfidence: hr.confidence,
        blinkRate: Math.round(bpmRate),
        cameraUsed: true,
      };
      const status: Computed['status'] = !ok
        ? 'retry'
        : hr.confidence < CONF_LOW
          ? 'low'
          : 'good';
      const band = hr.confidence >= CONF_LOW ? 3 : 5;

      cleanup();
      setComputed({
        result,
        status,
        band,
        debug: {
          elapsedSec: Math.round(elapsedMs / 1000),
          faceFrames,
          greenSamples: greens.length,
          trackEnded,
        },
      });
      setPhase('result');
    }

    function cleanup() {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    }

    run();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

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
      diag · {d.elapsedSec}s · frames {d.faceFrames} · samples {d.greenSamples} ·
      track {d.trackEnded ? 'ENDED early ⚠' : 'ok'}
    </p>
  );
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
