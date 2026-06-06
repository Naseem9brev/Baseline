import type { RawVoiceFeatures } from './analysis/types';

export type VoiceMetricStatus = 'stable' | 'monitor' | 'flag';

export interface VoiceMetricScores {
  jitter: VoiceMetricStatus;
  shimmer: VoiceMetricStatus;
  hnr: VoiceMetricStatus;
  mpt: VoiceMetricStatus;
  overall: VoiceMetricStatus;
}

/** NHS-oriented fixed thresholds (sessions 1–3); personal baseline comes later. */
export function scoreVoiceMetrics(v: RawVoiceFeatures): VoiceMetricScores {
  const jitter =
    v.jitter < 0.5 ? 'stable' : v.jitter > 2 ? 'flag' : 'monitor';
  const shimmer =
    v.shimmer < 5 ? 'stable' : v.shimmer > 12 ? 'flag' : 'monitor';
  const hnr = v.hnr > 20 ? 'stable' : v.hnr < 12 ? 'flag' : 'monitor';
  const mpt = v.mptSec >= 18 ? 'stable' : v.mptSec < 10 ? 'flag' : 'monitor';

  const statuses = [jitter, shimmer, hnr, mpt];
  const overall: VoiceMetricStatus = statuses.includes('flag')
    ? 'flag'
    : statuses.includes('monitor')
      ? 'monitor'
      : 'stable';

  return { jitter, shimmer, hnr, mpt, overall };
}

export const VOICE_STATUS_LABEL: Record<VoiceMetricStatus, string> = {
  stable: 'Stable',
  monitor: 'Monitor',
  flag: 'Discuss with GP',
};

export function statusBadgeClass(status: VoiceMetricStatus): string {
  switch (status) {
    case 'stable':
      return 'bg-emerald-100 text-emerald-800';
    case 'monitor':
      return 'bg-amber-100 text-amber-900';
    case 'flag':
      return 'bg-amber-200 text-amber-950';
  }
}
