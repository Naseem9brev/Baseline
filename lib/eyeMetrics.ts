import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { LEFT_EYE, RIGHT_EYE } from './mediapipe';

// Eye Aspect Ratio (EAR) blink detection — Soukupová & Čech (2016).
// EAR = vertical eyelid distance / horizontal eye width; drops sharply during a blink.

export const BLINK_THRESHOLD = 0.18;

function dist(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function earForEye(
  face: NormalizedLandmark[],
  e: { top: number; bottom: number; inner: number; outer: number },
): number {
  const v = dist(face[e.top], face[e.bottom]);
  const h = dist(face[e.inner], face[e.outer]);
  return h > 0 ? v / h : 0;
}

/** Mean eye-aspect-ratio across both eyes for a single frame's landmarks. */
export function eyeAspectRatio(face: NormalizedLandmark[]): number {
  return (earForEye(face, RIGHT_EYE) + earForEye(face, LEFT_EYE)) / 2;
}

/** Count blinks = number of times EAR dips below threshold then recovers. */
export function countBlinks(
  earSeries: number[],
  threshold = BLINK_THRESHOLD,
): number {
  let blinks = 0;
  let closed = false;
  for (const e of earSeries) {
    if (e < threshold && !closed) {
      closed = true;
    } else if (e >= threshold && closed) {
      closed = false;
      blinks++;
    }
  }
  return blinks;
}

export function blinkRate(blinks: number, ms: number): number {
  const minutes = ms / 60000;
  return minutes > 0 ? blinks / minutes : 0;
}

export interface ROI {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Forehead skin patch (in raw video pixel coords) for rPPG sampling — a stable,
 * mostly-hairless, well-perfused region. Uses hairline (10), glabella (9), and
 * face-edge (234/454) landmarks; clamped to the frame.
 */
export function foreheadROI(
  face: NormalizedLandmark[],
  width: number,
  height: number,
): ROI {
  const top = face[10];
  const brow = face[9];
  const left = face[234];
  const right = face[454];

  const cx = ((top.x + brow.x) / 2) * width;
  const cy = (top.y * 0.6 + brow.y * 0.4) * height;
  const faceW = Math.abs(right.x - left.x) * width;
  const half = Math.max(8, faceW * 0.13);
  const w = Math.round(half * 2);
  const h = Math.round(half * 1.1);

  const x = clamp(Math.round(cx - half), 0, Math.max(0, width - w));
  const y = clamp(Math.round(cy - h / 2), 0, Math.max(0, height - h));
  return { x, y, w: Math.min(w, width), h: Math.min(h, height) };
}

/** Mean R/G/B over a flat RGBA pixel buffer (e.g. from getImageData). */
export function meanRGB(data: Uint8ClampedArray): {
  r: number;
  g: number;
  b: number;
} {
  let r = 0;
  let g = 0;
  let b = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return n ? { r: r / n, g: g / n, b: b / n } : { r: 0, g: 0, b: 0 };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
