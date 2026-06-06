import type { DayRecord } from './storage';
import {
  extractHeartRate,
  overallSessionStatus,
  type MetricStatus,
} from './reportMetrics';

/** DD Mon YYYY — e.g. 6 Jun 2026 */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** DD/MM/YY — NHS form style */
export function formatDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const yy = String(y).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });
}

export interface MonthBucket {
  key: string;
  label: string;
  records: DayRecord[];
}

export function groupRecordsByMonth(records: DayRecord[]): MonthBucket[] {
  const map = new Map<string, DayRecord[]>();
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  for (const r of sorted) {
    const key = r.date.slice(0, 7);
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, recs]) => ({
      key,
      label: formatMonthLabel(key),
      records: recs.sort((a, b) => b.date.localeCompare(a.date)),
    }));
}

export type MonthReviewStatus = 'NORMAL' | 'REVIEW' | 'DISCUSS';

export interface MonthSummary {
  key: string;
  label: string;
  daysRecorded: number;
  flagDays: number;
  monitorDays: number;
  stableDays: number;
  monthStatus: MonthReviewStatus;
  note: string;
}

export function dayStatusCode(record: DayRecord): 'S' | 'M' | 'F' {
  const s = overallSessionStatus(record);
  if (s === 'flag') return 'F';
  if (s === 'monitor') return 'M';
  return 'S';
}

export function summarizeMonth(bucket: MonthBucket): MonthSummary {
  let flagDays = 0;
  let monitorDays = 0;
  let stableDays = 0;

  for (const r of bucket.records) {
    const code = dayStatusCode(r);
    if (code === 'F') flagDays++;
    else if (code === 'M') monitorDays++;
    else stableDays++;
  }

  let monthStatus: MonthReviewStatus = 'NORMAL';
  let note = 'All check-ins within expected range.';

  if (flagDays > 0) {
    monthStatus = 'DISCUSS';
    note =
      flagDays === 1
        ? '1 check-in outside expected range — review daily record below.'
        : `${flagDays} check-ins outside expected range — review daily record below.`;
  } else if (monitorDays >= 3 || monitorDays / bucket.records.length > 0.25) {
    monthStatus = 'REVIEW';
    note =
      monitorDays === 1
        ? '1 check-in slightly outside range — consider trend at appointment.'
        : `${monitorDays} check-ins slightly outside range — consider trend at appointment.`;
  }

  return {
    key: bucket.key,
    label: bucket.label,
    daysRecorded: bucket.records.length,
    flagDays,
    monitorDays,
    stableDays,
    monthStatus,
    note,
  };
}

export function monthStatusLabel(status: MonthReviewStatus): string {
  switch (status) {
    case 'NORMAL':
      return 'Normal';
    case 'REVIEW':
      return 'Review at appointment';
    case 'DISCUSS':
      return 'Discuss with GP';
  }
}

export function statusCodeLegend(status: MetricStatus): string {
  switch (status) {
    case 'stable':
      return 'S';
    case 'monitor':
      return 'M';
    case 'flag':
      return 'F';
  }
}

/** One row for the daily monitoring table. */
export function buildDailyRow(record: DayRecord): (string | number)[] {
  const hr = extractHeartRate(record.raw.face, record.stations.face?.note);
  const face = record.raw.face;
  const v = record.raw.voice;
  const react = record.raw.reaction;

  return [
    formatDateShort(record.date),
    hr ? Math.round(hr) : '—',
    face?.blinkRate && face.blinkRate > 0 ? face.blinkRate.toFixed(0) : '—',
    v ? v.jitter.toFixed(1) : '—',
    v ? v.shimmer.toFixed(1) : '—',
    v ? v.hnr.toFixed(0) : '—',
    v ? v.mptSec.toFixed(0) : '—',
    react ? Math.round(react.reactionMs) : '—',
    react ? Math.round(react.choiceReactionMs) : '—',
    react ? react.memoryMaxLength : '—',
    react ? react.wpm : '—',
    dayStatusCode(record),
  ];
}

export const DAILY_TABLE_HEAD = [
  'Date',
  'HR',
  'Blink',
  'Jit%',
  'Shm%',
  'HNR',
  'MPTs',
  'Tap',
  'Ch',
  'Mem',
  'WPM',
  'Code',
] as const;
