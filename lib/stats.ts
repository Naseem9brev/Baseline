import { dateKey, type RecordMap } from './storage';

/** Consecutive days with a check-in, ending today (or yesterday if today isn't done yet). */
export function currentStreak(records: RecordMap, today: Date = new Date()): number {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  if (!records[dateKey(d)]) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (records[dateKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function totalCheckins(records: RecordMap): number {
  return Object.keys(records).length;
}

export function averageScore(records: RecordMap): number {
  const vals = Object.values(records)
    .map((r) => r.baselineScore)
    .filter((n) => n > 0);
  return vals.length
    ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    : 0;
}
