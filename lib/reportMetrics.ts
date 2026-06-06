import type {
  RawFaceFeatures,
  RawVoiceFeatures,
} from './analysis/types';
import { scoreVoiceMetrics, VOICE_STATUS_LABEL, type VoiceMetricStatus } from './voiceScoring';
import type { DayRecord, RecordMap } from './storage';

export type MetricStatus = VoiceMetricStatus;

export const STATUS_LABEL: Record<MetricStatus, string> = VOICE_STATUS_LABEL;

export interface ReportSummary {
  patientLabel: string;
  exportedAt: string;
  dateRange: { from: string; to: string } | null;
  sessionCount: number;
  streak: number;
  averageBaselineScore: number;
  records: DayRecord[];
  latest: DayRecord | null;
}

export function buildReportSummary(
  records: RecordMap,
  patientLabel = 'Participant',
): ReportSummary {
  const sorted = sortedRecords(records);
  const dates = sorted.map((r) => r.date);

  return {
    patientLabel,
    exportedAt: new Date().toISOString(),
    dateRange:
      dates.length > 0
        ? { from: dates[dates.length - 1], to: dates[0] }
        : null,
    sessionCount: sorted.length,
    streak: computeStreak(sorted),
    averageBaselineScore: averageScore(sorted),
    records: sorted,
    latest: sorted[0] ?? null,
  };
}

export function sortedRecords(records: RecordMap): DayRecord[] {
  return Object.values(records).sort((a, b) => b.date.localeCompare(a.date));
}

function computeStreak(sorted: DayRecord[]): number {
  if (sorted.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const keys = new Set(sorted.map((r) => r.date));
  const d = new Date(today);
  const fmt = (dt: Date) =>
    `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  if (!keys.has(fmt(d))) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (keys.has(fmt(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function averageScore(sorted: DayRecord[]): number {
  const vals = sorted.map((r) => r.baselineScore).filter((n) => n > 0);
  return vals.length
    ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    : 0;
}

export function scoreHeartRate(bpm: number | undefined): MetricStatus {
  if (!bpm || bpm <= 0) return 'monitor';
  if (bpm >= 60 && bpm <= 100) return 'stable';
  if ((bpm >= 50 && bpm < 60) || (bpm > 100 && bpm <= 110)) return 'monitor';
  return 'flag';
}

export function scoreBlinkRate(rate: number | undefined): MetricStatus {
  if (rate === undefined || rate <= 0) return 'monitor';
  if (rate >= 12 && rate <= 25) return 'stable';
  if (rate >= 8 && rate <= 30) return 'monitor';
  return 'flag';
}

export function scoreReactionMs(ms: number, kind: 'tap' | 'choice'): MetricStatus {
  if (ms <= 0) return 'monitor';
  if (kind === 'tap') {
    if (ms < 350) return 'stable';
    if (ms <= 500) return 'monitor';
    return 'flag';
  }
  if (ms < 450) return 'stable';
  if (ms <= 650) return 'monitor';
  return 'flag';
}

export function scoreAccuracy(ratio: number): MetricStatus {
  const pct = ratio * 100;
  if (pct >= 90) return 'stable';
  if (pct >= 75) return 'monitor';
  return 'flag';
}

export function extractHeartRate(
  face: RawFaceFeatures | undefined,
  stationNote?: string,
): number | undefined {
  if (face?.heartRateBpm && face.heartRateBpm > 0) return face.heartRateBpm;
  const match = stationNote?.match(/HR\s*≈?\s*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

export function metricSeries(
  records: DayRecord[],
  picker: (r: DayRecord) => number | undefined,
): { date: string; value: number }[] {
  return [...records]
    .reverse()
    .map((r) => ({ date: r.date, value: picker(r) }))
    .filter((p): p is { date: string; value: number } => p.value !== undefined && p.value > 0);
}

export function computeTrend(values: number[]): 'improving' | 'stable' | 'declining' | 'insufficient' {
  if (values.length < 4) return 'insufficient';
  const mid = Math.floor(values.length / 2);
  const early = values.slice(0, mid);
  const recent = values.slice(mid);
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const delta = (avg(recent) - avg(early)) / avg(early);
  if (Math.abs(delta) < 0.08) return 'stable';
  return delta > 0 ? 'declining' : 'improving';
}

/** For metrics where lower is better (jitter, reaction time). */
export function computeLowerIsBetterTrend(values: number[]) {
  const trend = computeTrend(values);
  if (trend === 'insufficient') return trend;
  if (trend === 'improving') return 'declining' as const;
  if (trend === 'declining') return 'improving' as const;
  return 'stable' as const;
}

export function voiceStatusForRecord(v: RawVoiceFeatures | undefined) {
  if (!v) return null;
  return scoreVoiceMetrics(v);
}

export function formatStatus(status: MetricStatus): string {
  return STATUS_LABEL[status];
}

export function overallSessionStatus(record: DayRecord): MetricStatus {
  const statuses: MetricStatus[] = [];

  const hr = extractHeartRate(record.raw.face, record.stations.face?.note);
  if (hr) statuses.push(scoreHeartRate(hr));

  const voice = voiceStatusForRecord(record.raw.voice);
  if (voice) statuses.push(voice.overall);

  const reaction = record.raw.reaction;
  if (reaction) {
    statuses.push(scoreReactionMs(reaction.reactionMs, 'tap'));
    statuses.push(scoreReactionMs(reaction.choiceReactionMs, 'choice'));
  }

  if (statuses.includes('flag')) return 'flag';
  if (statuses.includes('monitor')) return 'monitor';
  return statuses.length ? 'stable' : 'monitor';
}

export function trendLabel(
  trend: 'improving' | 'stable' | 'declining' | 'insufficient',
): string {
  switch (trend) {
    case 'improving':
      return 'Improving over monitoring period';
    case 'declining':
      return 'Worsening over monitoring period — review trend';
    case 'stable':
      return 'Stable over monitoring period';
    case 'insufficient':
      return 'Insufficient data for trend (fewer than 4 sessions)';
  }
}
