// StreakPlant — a parametric SVG plant whose size/fullness encodes the streak.
// Pure function of `streak`. Ported from design/baseline-ui/screens-home.jsx.

interface Leaf {
  x: number;
  y: number;
  dir: number;
  len: number;
}

function leafPath({ x, y, dir, len }: Leaf): string {
  const tx = x + dir * len;
  const ty = y - len * 0.5;
  return (
    `M ${x} ${y} Q ${x + dir * len * 0.3} ${y - len * 0.78} ${tx} ${ty} ` +
    `Q ${x + dir * len * 0.58} ${y + len * 0.04} ${x} ${y} Z`
  );
}

export function streakWord(s: number): string {
  if (s >= 45) return 'flourishing';
  if (s >= 21) return 'in full bloom';
  if (s >= 7) return 'your longest yet';
  return 'just getting started';
}

export default function StreakPlant({
  streak = 0,
  size = 190,
}: {
  streak?: number;
  size?: number;
}) {
  const W = 160;
  const H = 168;
  const baseY = 142;
  const cx = 80;
  const sage = 'var(--sage)';
  const sageD = 'var(--sage-deep)';
  const saf = 'var(--ginseng)';

  const stemH = 40 + (Math.min(streak, 45) / 45) * 78; // 40..118
  const topY = baseY - stemH;
  const pairs = Math.max(2, Math.min(7, 2 + Math.floor(streak / 6)));
  const leaves: Leaf[] = [];
  for (let i = 0; i < pairs; i++) {
    const t = (i + 1) / (pairs + 1);
    const y = baseY - 12 - t * (stemH - 20);
    const len = 30 - t * 13;
    leaves.push({ x: cx + (i % 2 ? -1 : 1) * 1.5, y, dir: i % 2 ? -1 : 1, len });
  }
  const stem = `M ${cx} ${baseY} C ${cx - 5} ${baseY - stemH * 0.42}, ${cx + 5} ${baseY - stemH * 0.72}, ${cx} ${topY + 2}`;
  const flower = streak >= 21;
  const bud = streak >= 7 && !flower;

  return (
    <svg
      width={size}
      height={(size * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      style={{ overflow: 'visible' }}
    >
      <ellipse cx={cx} cy={topY + 18} rx={44} ry={48} fill="var(--ginseng-wash)" opacity="0.5" />
      <path d={`M 22 ${baseY + 10} H 138`} stroke={saf} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx={cx} cy={baseY + 10} rx={26} ry={5.5} fill="var(--ginseng-soft)" opacity="0.7" />
      <path d={stem} stroke={sageD} strokeWidth="3" strokeLinecap="round" />
      {leaves.map((lf, i) => (
        <g key={i}>
          <path d={leafPath(lf)} fill={sage} opacity={0.92} />
          <path
            d={`M ${lf.x} ${lf.y} Q ${lf.x + lf.dir * lf.len * 0.34} ${lf.y - lf.len * 0.5} ${lf.x + lf.dir * lf.len * 0.92} ${lf.y - lf.len * 0.46}`}
            stroke="var(--paper)"
            strokeWidth="1"
            opacity="0.5"
          />
        </g>
      ))}
      {flower ? (
        <g>
          {[0, 72, 144, 216, 288].map((a) => {
            const r = ((a - 90) * Math.PI) / 180;
            const px = cx + Math.cos(r) * 9;
            const py = topY - 2 + Math.sin(r) * 9;
            return (
              <ellipse
                key={a}
                cx={px}
                cy={py}
                rx={6.5}
                ry={9}
                fill={saf}
                opacity="0.92"
                transform={`rotate(${a} ${px} ${py})`}
              />
            );
          })}
          <circle cx={cx} cy={topY - 2} r={5} fill="var(--ginseng-deep)" />
        </g>
      ) : bud ? (
        <path
          d={`M ${cx} ${topY - 12} C ${cx - 7} ${topY - 6}, ${cx - 6} ${topY + 6}, ${cx} ${topY + 6} C ${cx + 6} ${topY + 6}, ${cx + 7} ${topY - 6}, ${cx} ${topY - 12} Z`}
          fill={saf}
        />
      ) : (
        <g>
          <path d={leafPath({ x: cx, y: topY + 4, dir: 1, len: 16 })} fill={sage} />
          <path d={leafPath({ x: cx, y: topY + 4, dir: -1, len: 16 })} fill={sage} />
        </g>
      )}
    </svg>
  );
}
