import type { StationKey, StationScore } from './types';

/** Combine per-station provisional scores into one Baseline Score + a one-line feedback. */
export function combineScore(
  stations: Partial<Record<StationKey, StationScore>>,
): { baselineScore: number; feedback: string } {
  const usable = Object.values(stations)
    .map((s) => s?.score ?? 0)
    .filter((n) => n > 0);

  if (usable.length === 0) {
    return { baselineScore: 0, feedback: 'No usable signal captured — try again.' };
  }

  const baselineScore = Math.round(
    usable.reduce((a, b) => a + b, 0) / usable.length,
  );
  return { baselineScore, feedback: feedbackFor(baselineScore) };
}

function feedbackFor(score: number): string {
  if (score >= 80) return 'Great baseline today — keep the streak going.';
  if (score >= 60) return 'Steady baseline, right around your usual.';
  if (score >= 40) return 'Slightly off your baseline — be kind to yourself today.';
  return 'Below your baseline — consider rest, water, and an early night.';
}
