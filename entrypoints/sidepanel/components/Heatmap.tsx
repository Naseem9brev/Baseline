import { dateKey, type RecordMap } from '@/lib/storage';

const WEEKS = 13;

/** GitHub-style contribution grid: one cell per day, colored by that day's Baseline Score. */
export default function Heatmap({ records }: { records: RecordMap }) {
  const columns = buildColumns(WEEKS);
  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((date, di) => {
              if (!date) return <div key={di} className="h-3.5 w-3.5" />;
              const rec = records[dateKey(date)];
              return (
                <div
                  key={di}
                  title={`${dateKey(date)}${rec ? ` · ${rec.baselineScore}` : ' · no check-in'}`}
                  className="h-3.5 w-3.5 rounded-sm"
                  style={{ backgroundColor: cellColor(rec?.baselineScore) }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
      <span>Low</span>
      {[20, 50, 70, 90].map((s) => (
        <div
          key={s}
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: cellColor(s) }}
        />
      ))}
      <span>High</span>
    </div>
  );
}

function cellColor(score?: number): string {
  if (score == null) return '#e2e8f0'; // slate-200 — no check-in
  if (score >= 80) return '#059669'; // emerald-600
  if (score >= 60) return '#34d399'; // emerald-400
  if (score >= 40) return '#fcd34d'; // amber-300
  return '#f87171'; // red-400
}

/** Build `weeks` columns of 7 days (Sun→Sat), ending with the current week. Future days are null. */
function buildColumns(weeks: number): (Date | null)[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - today.getDay())); // upcoming Saturday
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1)); // aligns to a Sunday

  const cols: (Date | null)[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: (Date | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      col.push(cur > today ? null : cur);
    }
    cols.push(col);
  }
  return cols;
}
