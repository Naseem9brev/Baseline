import { combineScore } from './analysis/score';
import type { StationScore } from './analysis/types';
import { dateKey, getRecords, setRecords, type RecordMap } from './storage';

// Deterministic demo history so the heatmap + streak look alive on first open.
// Index 0 = today, going back in time. A 0 means "no check-in that day" (a gap),
// but the most recent 7 days are all filled to show a 7-day streak.
const DEMO_SCORES = [88, 72, 64, 91, 78, 83, 95, 60, 0, 70, 82, 0, 68, 75, 90, 58];

function station(target: number, delta: number): StationScore {
  const score = Math.max(0, Math.min(100, target + delta));
  return { score, note: '' };
}

/** Seed demo records WITHOUT clobbering any real check-ins already stored. */
export async function seedDemoData(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seeded: RecordMap = {};

  for (let i = 0; i < DEMO_SCORES.length; i++) {
    const target = DEMO_SCORES[i];
    if (target === 0) continue; // a gap day
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const stations = {
      face: station(target, -3),
      voice: station(target, 2),
      reaction: station(target, 5),
    };
    const { baselineScore, feedback } = combineScore(stations);
    seeded[dateKey(d)] = {
      date: dateKey(d),
      baselineScore,
      stations,
      raw: {},
      feedback,
      createdAt: d.getTime(),
    };
  }

  const existing = await getRecords();
  // existing wins, so a real check-in is never overwritten by demo data.
  await setRecords({ ...seeded, ...existing });
}
