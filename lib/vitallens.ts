import { getVitalLensApiKey } from './settings';

// VitalLens cloud rPPG. We send pixelated 40×40 RGB face frames; per their ToS the
// frames + results live only briefly in server RAM and are deleted after processing.
// Docs: https://docs.rouast.com/  •  Contract: POST raw RGB24 (frames,40,40,3) base64.
const ENDPOINT = 'https://api.rouast.com/vitallens-v3/file';
const TIMEOUT_MS = 30_000;

/** Each VitalLens frame is a 40×40 RGB image. */
export const VL_SIZE = 40;
export const VL_FRAME_BYTES = VL_SIZE * VL_SIZE * 3;

export interface VitalLensResult {
  bpm: number;
  confidence: number; // 0..1
  faceDetected: boolean;
}

/**
 * Estimate heart rate from concatenated raw RGB24 40×40 frames.
 * Returns null if no key, request fails, or the response is unusable —
 * callers should fall back to the on-device estimate.
 */
export async function estimateHeartRateVitalLens(
  rgbFrames: Uint8Array,
  fps: number,
): Promise<VitalLensResult | null> {
  const apiKey = await getVitalLensApiKey();
  if (!apiKey || rgbFrames.length < VL_FRAME_BYTES) return null;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video: base64FromBytes(rgbFrames),
        fps,
        process_signals: true,
      }),
    });
    if (!res.ok) {
      console.warn('[VitalLens] HTTP', res.status, await safeText(res));
      return null;
    }
    const data = (await res.json()) as {
      vitals?: { heart_rate?: { value?: number; confidence?: number } };
      processing_status?: { face_detected?: boolean };
    };
    const hr = data.vitals?.heart_rate;
    if (!hr || typeof hr.value !== 'number') return null;
    return {
      bpm: Math.round(hr.value),
      confidence: hr.confidence ?? 0,
      faceDetected: data.processing_status?.face_detected ?? true,
    };
  } catch (err) {
    console.warn('[VitalLens] request failed', err);
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 200);
  } catch {
    return '';
  }
}

/** Base64-encode bytes in chunks (avoids call-stack limits on large arrays). */
function base64FromBytes(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
