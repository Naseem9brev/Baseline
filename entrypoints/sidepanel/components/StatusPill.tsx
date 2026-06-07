// Shared status pill (sage / amber / jujube) — ported from design/baseline-ui/frame.jsx.
export type Status = 'stable' | 'monitor' | 'flag';

const MAP: Record<Status, { cls: string; label: string }> = {
  stable: { cls: 'st-stable', label: 'Stable' },
  monitor: { cls: 'st-monitor', label: 'Monitor' },
  flag: { cls: 'st-flag', label: 'Discuss with GP' },
};

export default function StatusPill({ status }: { status: Status }) {
  const { cls, label } = MAP[status] ?? MAP.stable;
  return (
    <span className={`pill ${cls}`}>
      <span className="dot" />
      {label}
    </span>
  );
}

/** Map a 0..100 baseline score to a herb status (presentational only). */
export function statusFromScore(score: number): Status {
  if (score >= 70) return 'stable';
  if (score >= 45) return 'monitor';
  return 'flag';
}
