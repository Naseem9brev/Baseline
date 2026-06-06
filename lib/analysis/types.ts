// ─────────────────────────────────────────────────────────────────────────────
// ⚠ PLACEHOLDER SEAM
//
// This file defines the CONTRACT between raw signal capture (camera / mic / typing)
// and health scoring. The *actual clinical interpretation* — what eyes, skin color,
// voice tone, and typing reveal about health, and how they map to a score — is NOT
// defined here yet. It is pending research + doctor consultation.
//
// v1 captures raw features and runs them through `placeholder.ts`, which returns
// provisional, non-clinical numbers. When the real mapping is defined, it slots in
// behind these same types without touching capture / UI / storage / export.
// ─────────────────────────────────────────────────────────────────────────────

export type StationKey = 'face' | 'voice' | 'reaction';

/** Raw, uninterpreted signals captured during a check-in. */
export interface RawFaceFeatures {
  /** Blinks per minute, extrapolated from the sample window. */
  blinkRate: number;
  /** Mean eye-aspect-ratio over the sample (eye openness proxy). */
  eyeOpenness: number;
  /** Variance of iris position (lower = steadier gaze). */
  irisStability: number;
  /** Number of frames the face was actually detected in. */
  framesDetected: number;
}

export interface RawVoiceFeatures {
  /** Praat local jitter (%). NHS ref: <0.5 normal, >2 flagged. */
  jitter: number;
  /** Praat local shimmer (%). NHS ref: <5 normal, >12 flagged. */
  shimmer: number;
  /** Mean harmonics-to-noise ratio (dB). NHS ref: >20 normal, <12 flagged. */
  hnr: number;
  /** Maximum phonation time — sustained /a/ duration (seconds). */
  mptSec: number;
  /** Recording duration (seconds); same as mptSec for this test. */
  durationSec: number;
}

export interface RawReactionFeatures {
  /** Mean simple-reaction time, milliseconds. */
  reactionMs: number;
  /** Typing speed, words per minute. */
  wpm: number;
  /** Typing accuracy, 0..1. */
  accuracy: number;
}

export interface RawFeatures {
  face?: RawFaceFeatures;
  voice?: RawVoiceFeatures;
  reaction?: RawReactionFeatures;
}

/** A provisional per-station score. */
export interface StationScore {
  /** 0..100 — provisional, NOT a clinical measure. */
  score: number;
  /** Short human-readable note shown in the UI. */
  note: string;
}
