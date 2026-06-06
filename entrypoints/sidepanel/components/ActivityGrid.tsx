import { dateKey, type RecordMap } from '@/lib/storage';
import { statusFromScore } from './StatusPill';

// GitHub-style year grid in herb tones — ported from design/baseline-ui/dataviz.jsx,
// wired to real sessions. Status token per day; horizontally scrollable in the panel.
const WEEKS = 52;
const CELL: Record<'none' | 'stable' | 'monitor' | 'flag', string> = {
  none: 'var(--paper-sunk)',
  stable: 'var(--sage)',
  monitor: 'var(--saffron)',
  flag: 'var(--jujube)',
};

export default function ActivityGrid({ records }: { records: RecordMap }) {
  const columns = buildColumns(WEEKS);
  return (
    <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
      <div className="grid-cal">
        {columns.map((week, wi) => (
          <div className="grid-col" key={wi}>
            {week.map((date, di) => {
              if (!date) return <span key={di} className="gcell" style={{ background: 'transparent' }} />;
              const rec = records[dateKey(date)];
              const bg = rec ? CELL[statusFromScore(rec.baselineScore)] : CELL.none;
              return (
                <span
                  key={di}
                  className="gcell"
                  title={`${dateKey(date)}${rec ? ` · ${rec.baselineScore}` : ' · no check-in'}`}
                  style={{ background: bg }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function GridLegend() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5, color: 'var(--ink-3)' }}>
      <span>Less</span>
      <span style={{ display: 'flex', gap: 3 }}>
        {(['none', 'stable', 'stable', 'monitor', 'flag'] as const).map((s, i) => (
          <span key={i} className="gcell" style={{ background: CELL[s] }} />
        ))}
      </span>
      <span>More</span>
    </div>
  );
}

/** Last `weeks` columns of 7 days (Sun→Sat) ending this week; future days null. */
function buildColumns(weeks: number): (Date | null)[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - today.getDay()));
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));

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
