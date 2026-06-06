import { useEffect, useRef, useState } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { getFaceLandmarker, IRIS, LEFT_EYE, RIGHT_EYE } from '@/lib/mediapipe';
import type { RawFaceFeatures } from '@/lib/analysis/types';

const CAPTURE_MS = 6000;
const BLINK_THRESHOLD = 0.18; // eye-aspect ratio below this = eye considered shut

type Phase = 'init' | 'capturing';

export default function FaceStation({
  onComplete,
  onError,
}: {
  onComplete: (raw: RawFaceFeatures) => void;
  onError: (kind: 'denied' | 'error') => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('init');
  const [remaining, setRemaining] = useState(Math.ceil(CAPTURE_MS / 1000));

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    // Accumulators for raw (uninterpreted) features.
    const earSamples: number[] = [];
    const irisX: number[] = [];
    const irisY: number[] = [];
    let blinks = 0;
    let eyesClosed = false;
    let framesDetected = 0;

    async function run() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
      } catch (e) {
        if (!cancelled) {
          onError((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'error');
        }
        return;
      }
      if (cancelled) return;

      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => {});

      let landmarker;
      try {
        landmarker = await getFaceLandmarker();
      } catch {
        if (!cancelled) onError('error');
        return;
      }
      if (cancelled) return;

      setPhase('capturing');
      const start = performance.now();
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;

      const loop = () => {
        if (cancelled) return;
        const now = performance.now();
        const elapsed = now - start;
        setRemaining(Math.max(0, Math.ceil((CAPTURE_MS - elapsed) / 1000)));

        if (video.videoWidth > 0) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const res = landmarker!.detectForVideo(video, now);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const face = res.faceLandmarks?.[0];
          if (face) {
            framesDetected++;
            const ear =
              (eyeAspect(face, RIGHT_EYE) + eyeAspect(face, LEFT_EYE)) / 2;
            earSamples.push(ear);
            if (ear < BLINK_THRESHOLD && !eyesClosed) {
              eyesClosed = true;
            } else if (ear >= BLINK_THRESHOLD && eyesClosed) {
              eyesClosed = false;
              blinks++;
            }
            const ir = face[IRIS.right];
            const il = face[IRIS.left];
            irisX.push((ir.x + il.x) / 2);
            irisY.push((ir.y + il.y) / 2);
            drawOverlay(ctx, face, canvas.width, canvas.height);
          }
        }

        if (elapsed >= CAPTURE_MS) {
          finish();
          return;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function finish() {
      const durMin = CAPTURE_MS / 60000;
      const raw: RawFaceFeatures = {
        blinkRate: blinks / durMin,
        eyeOpenness: mean(earSamples),
        irisStability: variance(irisX) + variance(irisY),
        framesDetected,
      };
      cleanup();
      onComplete(raw);
    }

    function cleanup() {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    }

    run();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-slate-900 aspect-[4/3]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        {phase === 'init' && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/80 text-center text-sm text-white">
            <div>
              <Spinner />
              <p className="mt-2">Initializing camera + model…</p>
              <p className="text-[11px] text-white/60">First run loads the AI model once.</p>
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
          : 'Look at the camera and stay still…'}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
  );
}

// ── geometry helpers (raw signal extraction only — no clinical meaning) ──────────
function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function eyeAspect(
  face: NormalizedLandmark[],
  e: { top: number; bottom: number; inner: number; outer: number },
): number {
  const v = dist(face[e.top], face[e.bottom]);
  const h = dist(face[e.inner], face[e.outer]);
  return h > 0 ? v / h : 0;
}

function mean(a: number[]): number {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}

function variance(a: number[]): number {
  if (!a.length) return 0;
  const m = mean(a);
  return mean(a.map((x) => (x - m) ** 2));
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  face: NormalizedLandmark[],
  w: number,
  h: number,
) {
  // Iris centers
  ctx.fillStyle = '#22d3ee';
  for (const idx of [IRIS.right, IRIS.left]) {
    const p = face[idx];
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Eye landmark dots
  ctx.fillStyle = 'rgba(16,185,129,0.9)';
  for (const e of [RIGHT_EYE, LEFT_EYE]) {
    for (const idx of [e.top, e.bottom, e.inner, e.outer]) {
      const p = face[idx];
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
