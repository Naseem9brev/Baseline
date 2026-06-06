// ─────────────────────────────────────────────────────────────────────────────
// ⚠ PLACEHOLDER SCORING — NOT clinically validated.
//
// These functions turn raw captured features into provisional 0..100 numbers so the
// app's flow (score → heatmap → export) works end-to-end. The coefficients here are
// arbitrary placeholders. The REAL mapping from eyes/skin/voice/typing to a health
// signal is defined later from research + doctor consultation, and replaces the
// bodies of these functions without changing their signatures (see ./types.ts).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  RawFaceFeatures,
  RawReactionFeatures,
  RawVoiceFeatures,
  StationScore,
} from './types';

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function provisionalNote(score: number): string {
  if (score >= 80) return 'Looking sharp today.';
  if (score >= 60) return 'Solid — within your usual range.';
  if (score >= 40) return 'A bit below par — take it easy.';
  return 'Low reading — rest up.';
}

export function scoreFace(f: RawFaceFeatures): StationScore {
  if (f.framesDetected < 5) {
    return { score: 0, note: 'Face not detected clearly — check your lighting.' };
  }
  const openness = clamp(f.eyeOpenness * 300); // EAR ~0.25 -> ~75
  const steadiness = clamp(100 - f.irisStability * 4000); // lower variance -> higher
  const blink = clamp(100 - Math.abs(f.blinkRate - 17) * 4); // ~17 blinks/min -> peak
  const score = Math.round(0.4 * openness + 0.4 * steadiness + 0.2 * blink);
  return { score: clamp(score), note: provisionalNote(score) };
}

export function scoreVoice(f: RawVoiceFeatures): StationScore {
  if (f.durationSec < 0.5) return { score: 0, note: 'No voice captured.' };
  const loudness = clamp(f.rms * 400); // RMS ~0.1–0.25
  const duration = clamp((f.durationSec / 5) * 100);
  const score = Math.round(0.6 * loudness + 0.4 * duration);
  return { score: clamp(score), note: provisionalNote(score) };
}

export function scoreReaction(f: RawReactionFeatures): StationScore {
  const reaction = clamp(100 - (f.reactionMs - 150) / 4); // 150ms -> 100, 550ms -> 0
  const choice = clamp(100 - (f.choiceReactionMs - 200) / 5); // 200ms -> 100, 700ms -> 0
  const choiceAcc = clamp(f.choiceAccuracy * 100);
  const speed = clamp(f.wpm * 2.5); // 40 wpm -> 100
  const accuracy = clamp(f.accuracy * 100);
  const score = Math.round(
    0.25 * reaction +
      0.25 * choice +
      0.15 * choiceAcc +
      0.2 * speed +
      0.15 * accuracy,
  );
  return { score: clamp(score), note: provisionalNote(score) };
}
