/* global window */
const { Ic, Mark, Nav, StatusPill, Body, Sparkline, ActivityGrid } = window;

/* small decorative apothecary seal */
function Seal({ size = 132, status = "stable" }) {
  const ring = { stable: "var(--sage)", monitor: "var(--saffron)", flag: "var(--jujube)" }[status];
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <circle cx="60" cy="60" r="54" stroke="var(--line)" strokeWidth="1" />
      <circle cx="60" cy="60" r="46" stroke={ring} strokeWidth="2.5" strokeDasharray="3 252"
        strokeLinecap="round" transform="rotate(-90 60 60)" opacity="0.0" />
      <circle cx="60" cy="60" r="46" stroke={ring} strokeWidth="3" strokeLinecap="round"
        strokeDasharray="248 40" transform="rotate(-128 60 60)" />
      <path d="M60 74c0-9 0-15 0-20" stroke={ring} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M60 54c-5 .4-8.4-2.2-9.2-7 5-.6 8.3 1.6 9.2 7Z" fill={ring} />
      <path d="M60 50c3.8-3.2 7.8-3.4 11.4-1-2.6 4-6.4 5-11.4 1Z" fill={ring} />
      <path d="M44 78h32" stroke={ring} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/* ===================== ONBOARDING ===================== */
function OnbWelcome() {
  return (
    <Body center>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 4 }}>
        <Seal size={120} status="stable" />
        <h1 className="serif-h" style={{ fontSize: 34, margin: "22px 0 0" }}>Baseline</h1>
        <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 19, color: "var(--ginseng)", margin: "8px 0 0" }}>
          a clear line on how you’re doing
        </p>
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: "var(--ink-2)", margin: "18px 0 0", maxWidth: 300 }}>
          Sixty seconds a day. Three gentle checks build a quiet record of your everyday wellbeing.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, color: "var(--ink-3)" }}>
          <Ic.shield width={16} height={16} style={{ color: "var(--sage)" }} />
          Everything stays on this device
        </div>
        <button className="btn btn-primary">Get started</button>
        <p className="muted" style={{ textAlign: "center", fontSize: 13, margin: 0 }}>About a minute a day · no account needed</p>
      </div>
    </Body>
  );
}

function OnbName() {
  return (
    <Body>
      <button className="sp-x" style={{ marginLeft: -4, color: "var(--ink-2)" }}><Ic.back width={20} height={20} /></button>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span className="eyebrow">Step 1 of 2</span>
        <h2 className="serif-h" style={{ fontSize: 27, margin: "12px 0 0", lineHeight: 1.15 }}>
          What should Baseline<br />call you?
        </h2>
        <p style={{ fontSize: 16, color: "var(--ink-2)", margin: "12px 0 26px", lineHeight: 1.55 }}>
          Just a first name, so each morning feels like yours. It never leaves this device.
        </p>
        <label className="eyebrow" style={{ marginBottom: 8, display: "block" }}>First name</label>
        <input className="input focus" defaultValue="Mei" />
      </div>
      <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        Continue <Ic.arrow width={19} height={19} />
      </button>
    </Body>
  );
}

/* ===================== STREAK PLANT — grows with the streak ===================== */
function leafPath({ x, y, dir, len }) {
  const tx = x + dir * len, ty = y - len * 0.5;
  return `M ${x} ${y} Q ${x + dir * len * 0.3} ${y - len * 0.78} ${tx} ${ty} `
       + `Q ${x + dir * len * 0.58} ${y + len * 0.04} ${x} ${y} Z`;
}
function StreakPlant({ streak = 12, size = 190 }) {
  const W = 160, H = 168, baseY = 142, cx = 80;
  const sage = "var(--sage)", sageD = "var(--sage-deep)", saf = "var(--ginseng)";
  const stemH = 40 + Math.min(streak, 45) / 45 * 78;          // 40..118
  const topY = baseY - stemH;
  const pairs = Math.max(2, Math.min(7, 2 + Math.floor(streak / 6)));
  const leaves = [];
  for (let i = 0; i < pairs; i++) {
    const t = (i + 1) / (pairs + 1);
    const y = baseY - 12 - t * (stemH - 20);
    const len = 30 - t * 13;
    leaves.push({ x: cx + (i % 2 ? -1 : 1) * 1.5, y, dir: i % 2 ? -1 : 1, len });
  }
  const stem = `M ${cx} ${baseY} C ${cx - 5} ${baseY - stemH * 0.42}, ${cx + 5} ${baseY - stemH * 0.72}, ${cx} ${topY + 2}`;
  const flower = streak >= 21, bud = streak >= 7 && !flower;
  return (
    <svg width={size} height={size * H / W} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ overflow: "visible" }}>
      {/* soft halo */}
      <ellipse cx={cx} cy={topY + 18} rx={44} ry={48} fill="var(--ginseng-wash)" opacity="0.5" />
      {/* the baseline — brand nod */}
      <path d={`M 22 ${baseY + 10} H 138`} stroke={saf} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx={cx} cy={baseY + 10} rx={26} ry={5.5} fill="var(--ginseng-soft)" opacity="0.7" />
      {/* stem */}
      <path d={stem} stroke={sageD} strokeWidth="3" strokeLinecap="round" />
      {/* leaves */}
      {leaves.map((lf, i) => (
        <g key={i}>
          <path d={leafPath(lf)} fill={sage} opacity={0.92} />
          <path d={`M ${lf.x} ${lf.y} Q ${lf.x + lf.dir * lf.len * 0.34} ${lf.y - lf.len * 0.5} ${lf.x + lf.dir * lf.len * 0.92} ${lf.y - lf.len * 0.46}`}
            stroke="var(--paper)" strokeWidth="1" opacity="0.5" />
        </g>
      ))}
      {/* crown */}
      {flower ? (
        <g>
          {[0, 72, 144, 216, 288].map((a) => {
            const r = (a - 90) * Math.PI / 180;
            return <ellipse key={a} cx={cx + Math.cos(r) * 9} cy={topY - 2 + Math.sin(r) * 9}
              rx={6.5} ry={9} fill={saf} opacity="0.92" transform={`rotate(${a} ${cx + Math.cos(r) * 9} ${topY - 2 + Math.sin(r) * 9})`} />;
          })}
          <circle cx={cx} cy={topY - 2} r={5} fill="var(--ginseng-deep)" />
        </g>
      ) : bud ? (
        <path d={`M ${cx} ${topY - 12} C ${cx - 7} ${topY - 6}, ${cx - 6} ${topY + 6}, ${cx} ${topY + 6} C ${cx + 6} ${topY + 6}, ${cx + 7} ${topY - 6}, ${cx} ${topY - 12} Z`} fill={saf} />
      ) : (
        <g>
          <path d={leafPath({ x: cx, y: topY + 4, dir: 1, len: 16 })} fill={sage} />
          <path d={leafPath({ x: cx, y: topY + 4, dir: -1, len: 16 })} fill={sage} />
        </g>
      )}
    </svg>
  );
}

function streakWord(s) {
  if (s >= 45) return "flourishing";
  if (s >= 21) return "in full bloom";
  if (s >= 7) return "your longest yet";
  return "just getting started";
}

/* ===================== HOME · DIRECTION A — Calm (chosen) ===================== */
function HomeCalm({ streak = 12 }) {
  return (
    <>
      <Body>
        <span className="eyebrow">Thursday · 6 June</span>
        <h2 className="serif-h" style={{ fontSize: 26, margin: "8px 0 0" }}>Good morning, Mei</h2>

        <div className="center-col" style={{ margin: "18px 0 4px" }}>
          <StreakPlant streak={streak} size={186} />
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14, whiteSpace: "nowrap" }}>
            <span className="tabnum serif-h" style={{ fontSize: 30, color: "var(--ginseng-deep)" }}>{streak}</span>
            <span style={{ fontSize: 15, color: "var(--ink-2)", fontWeight: 600 }}>days growing</span>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-3)", margin: "3px 0 0" }}>{streakWord(streak)}</p>
          <div style={{ marginTop: 14 }}><StatusPill status="stable" /></div>
        </div>

        <div style={{ flex: 1, minHeight: 14 }} />

        <button className="card" style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "default", width: "100%", border: "1px solid var(--ginseng-soft)", background: "var(--ginseng-wash)" }}>
          <span className="mrow-ic" style={{ background: "var(--ginseng)", color: "#FFF8EC", width: 40, height: 40 }}><Ic.tests width={22} height={22} /></span>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>Begin today’s check-in</span>
            <span style={{ display: "block", fontSize: 13.5, color: "var(--ink-2)", marginTop: 2 }}>Keep your plant growing · ~60s</span>
          </span>
          <Ic.arrow width={20} height={20} style={{ color: "var(--ginseng-deep)" }} />
        </button>
      </Body>
      <Nav active="home" />
    </>
  );
}

/* ===================== HOME · DIRECTION B — Warm ===================== */
function ReadChip({ Icon, label, value, status }) {
  const c = { stable: "var(--sage)", monitor: "var(--saffron)", flag: "var(--jujube)" }[status];
  return (
    <div className="card flat wash" style={{ padding: "13px 12px", flex: 1, textAlign: "center" }}>
      <Icon width={20} height={20} style={{ color: "var(--ink-3)" }} />
      <div className="tabnum" style={{ fontFamily: "var(--serif)", fontSize: 20, marginTop: 6, color: "var(--ink)" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>{label}</div>
      <span className="dot" style={{ background: c, margin: "8px auto 0", display: "block" }} />
    </div>
  );
}
function HomeWarm() {
  const week = ["stable", "stable", "monitor", "stable", "stable", "stable", "stable"];
  return (
    <>
      <Body>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span className="mark" style={{ width: 38, height: 38, borderRadius: 999, background: "var(--ginseng-wash)", color: "var(--ginseng-deep)", fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600 }}>M</span>
          <div>
            <div className="eyebrow">Thursday morning</div>
            <h2 className="serif-h" style={{ fontSize: 21, margin: "2px 0 0" }}>Good morning, Mei</h2>
          </div>
        </div>

        <div className="card" style={{ marginTop: 18, padding: 0, overflow: "hidden", border: "1px solid var(--ginseng-soft)" }}>
          <div style={{ background: "linear-gradient(135deg, #F3E7D4, #EFE6D2 55%, #E7E6D2)", padding: "18px 18px 16px", position: "relative" }}>
            <Ic.leaf width={66} height={66} style={{ color: "var(--ginseng)", opacity: .16, position: "absolute", right: 8, top: 8 }} />
            <StatusPill status="stable" />
            <p style={{ fontFamily: "var(--serif)", fontSize: 19, lineHeight: 1.4, color: "var(--ink)", margin: "12px 0 0", maxWidth: 240 }}>
              You’ve checked in <strong>12 days</strong> running. Lovely consistency, Mei.
            </p>
          </div>
          <div style={{ padding: 14 }}>
            <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap", fontSize: 16 }}>
              Start today’s check-in <Ic.arrow width={19} height={19} />
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <ReadChip Icon={Ic.keyboard} label="Typing" value="18ms" status="stable" />
          <ReadChip Icon={Ic.mic} label="Voice" value="0.8%" status="stable" />
          <ReadChip Icon={Ic.eye} label="Eye" value="232ms" status="monitor" />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
            <span className="eyebrow">This week</span>
            <span style={{ fontSize: 12.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 5 }}>
              <Ic.flame width={14} height={14} style={{ color: "var(--saffron)" }} /> 12-day streak
            </span>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {week.map((s, i) => (
              <div key={i} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ height: 30, borderRadius: 8, background: { stable: "var(--sage-soft)", monitor: "var(--saffron-soft)", flag: "var(--jujube-soft)" }[s], display: "grid", placeItems: "center" }}>
                  <span className="dot" style={{ background: { stable: "var(--sage)", monitor: "var(--saffron)", flag: "var(--jujube)" }[s] }} />
                </div>
                <div style={{ fontSize: 10.5, color: "var(--ink-4)", marginTop: 4 }}>{"MTWTFSS"[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </Body>
      <Nav active="home" />
    </>
  );
}

/* ===================== HOME · DIRECTION C — Clinical ===================== */
function MetricCard({ Icon, label, value, unit, status, data, color }) {
  const c = { stable: "var(--sage)", monitor: "var(--saffron)", flag: "var(--jujube)" }[status];
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon width={17} height={17} style={{ color: "var(--ink-3)" }} />
        <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 600, flex: 1 }}>{label}</span>
        <span className="dot" style={{ background: c }} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 8 }}>
        <div className="tabnum" style={{ fontFamily: "var(--serif)", fontSize: 23, color: "var(--ink)", lineHeight: 1 }}>
          {value}<span style={{ fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--sans)", marginLeft: 2 }}>{unit}</span>
        </div>
        <Sparkline data={data} color={color} w={88} h={30} />
      </div>
    </div>
  );
}
function HomeClinical() {
  return (
    <>
      <Body>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="eyebrow">Thursday · 6 June</span>
            <h2 className="serif-h" style={{ fontSize: 22, margin: "4px 0 0" }}>Good morning, Mei</h2>
          </div>
          <StatusPill status="stable" />
        </div>

        <button className="card" style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", cursor: "default", background: "var(--ginseng)", border: "none" }}>
          <span style={{ flex: 1 }}>
            <span style={{ display: "block", fontSize: 15.5, fontWeight: 700, color: "#FBF3E6" }}>Today’s check-in is ready</span>
            <span style={{ display: "block", fontSize: 12.5, color: "rgba(251,243,230,.8)", marginTop: 2 }}>Typing · Voice · Eye — about 60s</span>
          </span>
          <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 999, background: "rgba(255,255,255,.18)", color: "#FBF3E6" }}><Ic.arrow width={18} height={18} /></span>
        </button>

        <div className="eyebrow" style={{ margin: "20px 0 10px" }}>Yesterday’s readings</div>
        <div style={{ display: "grid", gap: 10 }}>
          <MetricCard Icon={Ic.keyboard} label="Typing rhythm" value="18.4" unit="ms" status="stable" color="var(--sage)" data={[26, 22, 24, 20, 21, 19, 18.4]} />
          <MetricCard Icon={Ic.mic} label="Voice jitter" value="0.82" unit="%" status="stable" color="var(--sage)" data={[1.1, 0.9, 1.0, 0.85, 0.9, 0.8, 0.82]} />
          <MetricCard Icon={Ic.eye} label="Eye reaction" value="232" unit="ms" status="monitor" color="var(--saffron)" data={[210, 215, 220, 218, 225, 228, 232]} />
        </div>

        <div className="card flat wash" style={{ marginTop: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "center" }}>
            <div className="tabnum serif-h" style={{ fontSize: 22 }}>12</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>day streak</div>
          </div>
          <div className="divider" style={{ width: 1, height: 30, background: "var(--line)" }} />
          <div style={{ flex: 1 }}>
            <ActivityGrid weeks={17} cell={9} gap={3} />
          </div>
        </div>
      </Body>
      <Nav active="home" />
    </>
  );
}

Object.assign(window, { Seal, StreakPlant, OnbWelcome, OnbName, HomeCalm, HomeWarm, HomeClinical });
