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
import { scoreVoiceMetrics, VOICE_STATUS_LABEL } from '../voiceScoring';

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
  if (f.jitter === 0 && f.shimmer === 0) {
    return { score: 0, note: 'Could not detect a steady vowel — try again.' };
  }

  const { overall } = scoreVoiceMetrics(f);
  const flags = [overall === 'flag', overall === 'monitor'].filter(Boolean).length;
  const score = clamp(Math.round(100 - flags * 18 - Math.max(0, f.jitter - 0.5) * 8));

  const note =
    overall === 'stable'
      ? 'Voice steady today — within expected range for this check.'
      : overall === 'monitor'
        ? 'Voice slightly variable today — one day is not a trend.'
        : 'Voice reading worth monitoring — speak with your GP if this continues.';

  return { score: clamp(score), note: `${VOICE_STATUS_LABEL[overall]}. ${note}` };
}

const MEMORY_TARGET: Record<RawReactionFeatures['memoryDifficulty'], number> = {
  easy: 6,
  medium: 5,
  hard: 4,
};

export interface ReactionSubScores {
  tap: number;
  choice: number;
  choiceAcc: number;
  memory: number;
}

export function reactionSubScores(f: RawReactionFeatures): ReactionSubScores {
  return {
    // Placeholder — 500 ms -> 50 (midpoint), 300 ms -> 100, floor 40.
    tap: Math.max(40, clamp(50 + (500 - f.reactionMs) / 4)),
    choice: clamp(100 - (f.choiceReactionMs - 200) / 5),
    choiceAcc: clamp(f.choiceAccuracy * 100),
    memory: clamp(
      (f.memoryMaxLength / MEMORY_TARGET[f.memoryDifficulty]) * 100,
    ),
  };
}

export function scoreReaction(f: RawReactionFeatures): StationScore {
  const s = reactionSubScores(f);
  const score = Math.round(
    0.3 * s.tap +
      0.3 * s.choice +
      0.2 * s.choiceAcc +
      0.2 * s.memory,
  );
  return { score: clamp(score), note: provisionalNote(score) };
}
