/* global window */
const { Ic } = window;

/* deterministic pseudo-random so screens are stable */
function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

/* a year of sessions: status by herb tone */
function genYear(seed = 7) {
  const rnd = seeded(seed);
  const days = [];
  for (let i = 0; i < 371; i++) {
    const r = rnd();
    let st = "none";
    if (i > 120) { // started ~8 months ago, denser lately
      if (r > 0.30) st = "stable";
      if (r > 0.86) st = "monitor";
      if (r > 0.965) st = "flag";
      if (r < 0.30 && r > 0.16 && i < 250) st = "none";
    } else if (r > 0.62) {
      st = r > 0.92 ? "monitor" : "stable";
    }
    days.push(st);
  }
  // guarantee a strong recent streak
  for (let i = 359; i < 371; i++) days[i] = i === 366 ? "monitor" : "stable";
  return days;
}

const CAL = {
  none: "var(--paper-sunk)",
  stable: "var(--sage)",
  monitor: "var(--saffron)",
  flag: "var(--jujube)",
};
const CAL_SOFT = { none: "var(--paper-sunk)", stable: "#A9B091", monitor: "#D7B274", flag: "#B47878" };

function ActivityGrid({ seed = 7, weeks = 53, cell = 9, gap = 3, soft = false }) {
  const days = genYear(seed);
  const start = days.length - weeks * 7;
  const cols = [];
  for (let w = 0; w < weeks; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const st = days[start + w * 7 + d] || "none";
      col.push(<span key={d} className="gcell"
        style={{ width: cell, height: cell, background: (soft ? CAL_SOFT : CAL)[st] }} />);
    }
    cols.push(<span key={w} className="grid-col" style={{ gap }}>{col}</span>);
  }
  return <div className="grid-cal" style={{ gap }}>{cols}</div>;
}

/* smooth-ish sparkline with soft area fill */
function Sparkline({ data, color = "var(--ginseng)", w = 132, h = 38, pad = 4 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const span = max - min || 1;
  const x = (i) => pad + (i / (data.length - 1)) * (w - pad * 2);
  const y = (v) => pad + (1 - (v - min) / span) * (h - pad * 2);
  const line = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)} ${h} L${x(0).toFixed(1)} ${h} Z`;
  const id = "g" + Math.round(x(1) * 1000) + color.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.16" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="2.6" fill={color} />
    </svg>
  );
}

/* small dot legend for activity grid */
function GridLegend() {
  const items = [["none", "—"], ["stable", "Stable"], ["monitor", "Monitor"], ["flag", "Flag"]];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "var(--ink-3)" }}>
      <span>Less</span>
      <span style={{ display: "flex", gap: 3 }}>
        {["none", "stable", "stable", "monitor", "flag"].map((s, i) =>
          <span key={i} className="gcell" style={{ width: 9, height: 9, background: CAL[s] }} />)}
      </span>
      <span>More</span>
    </div>
  );
}

Object.assign(window, { ActivityGrid, Sparkline, GridLegend, CAL });
