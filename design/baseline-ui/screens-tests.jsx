/* global window */
const { Ic, Nav, StatusPill, Body, Seal } = window;

function Steps({ active }) {
  const s = [["Typing", Ic.keyboard], ["Voice", Ic.mic], ["Eye", Ic.eye]];
  return (
    <div className="steps" style={{ justifyContent: "center", marginBottom: 22 }}>
      {s.map(([label, Icon], i) => {
        const state = i < active ? "done" : i === active ? "on" : "todo";
        return (
          <React.Fragment key={label}>
            <div className={"step-pill " + state}>
              <span className="step-num">{i < active ? <Ic.check width={12} height={12} /> : i + 1}</span>
              {label}
            </div>
            {i < 2 && <span style={{ color: "var(--ink-4)", fontSize: 13 }}>›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ===================== TESTS INTRO ===================== */
function TestsIntro() {
  const tips = [
    [Ic.sun, "Find good light", "Sit facing a window or lamp so your eyes are clearly lit."],
    [Ic.quiet, "Somewhere quiet", "A calm, low-noise spot helps the voice check read cleanly."],
  ];
  return (
    <>
      <Body>
        <span className="eyebrow">Today’s check-in</span>
        <h2 className="serif-h" style={{ fontSize: 26, margin: "8px 0 4px" }}>Two quick things first</h2>
        <p style={{ fontSize: 15.5, color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 22px" }}>
          A calm setting makes today’s readings more accurate. No pass or fail — we’re only noticing your pattern.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {tips.map(([Icon, t, d]) => (
            <div key={t} className="card flat" style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16 }}>
              <span className="mrow-ic" style={{ background: "var(--ginseng-wash)", color: "var(--ginseng-deep)", width: 42, height: 42, flex: "0 0 auto" }}><Icon width={22} height={22} /></span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: 16.5, fontWeight: 700 }}>{t}</span>
                <span style={{ display: "block", fontSize: 14, color: "var(--ink-2)", marginTop: 3, lineHeight: 1.45 }}>{d}</span>
              </span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 16 }} />
        <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }}>
          Begin <Ic.arrow width={19} height={19} />
        </button>
        <p className="muted" style={{ textAlign: "center", fontSize: 12.5, margin: "10px 0 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Ic.shield width={14} height={14} style={{ color: "var(--sage)" }} /> Camera & mic stay on your device
        </p>
      </Body>
      <Nav active="tests" />
    </>
  );
}

/* ===================== TYPING ===================== */
function TypingTest() {
  const target = "today i feel well and my mind is clear";
  const typed = "today i feel well and my m";
  return (
    <>
      <Body>
        <Steps active={0} />
        <span className="eyebrow">Typing · step 1 of 3</span>
        <h2 className="serif-h" style={{ fontSize: 22, margin: "6px 0 14px" }}>Type the sentence below</h2>

        <div className="card wash flat" style={{ padding: "16px 18px" }}>
          <p style={{ margin: 0, fontFamily: "var(--serif)", fontSize: 21, lineHeight: 1.5, letterSpacing: ".01em" }}>
            {target.split("").map((ch, i) => (
              <span key={i} style={{ color: i < typed.length ? "var(--ink)" : "var(--ink-4)" }}>{ch}</span>
            ))}
          </p>
        </div>

        <div style={{ position: "relative", marginTop: 14 }}>
          <div className="input focus" style={{ fontSize: 19, minHeight: 56, fontFamily: "var(--serif)", letterSpacing: ".01em", lineHeight: 1.5 }}>
            {typed}<span style={{ width: 2, height: 21, background: "var(--ginseng)", margin: "0 1px -3px", display: "inline-block", borderRadius: 1 }} />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13.5, color: "var(--sage-deep)" }}>
          <Ic.check width={16} height={16} /> Matching nicely — keep your natural pace
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="track"><i style={{ width: "68%", background: "var(--ginseng)" }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--ink-3)", marginTop: 6 }}>
            <span>26 of 38 characters</span><span>auto-finishes when complete</span>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 18 }} />
        <p className="muted" style={{ fontSize: 12.5, textAlign: "center", margin: 0 }}>
          We measure <em>how</em> you type — never what. Same sentence every day.
        </p>
      </Body>
      <Nav active="tests" />
    </>
  );
}

/* ===================== VOICE ===================== */
function VoiceTest() {
  const bars = [14, 26, 40, 30, 52, 38, 58, 44, 30, 48, 36, 24, 40, 28, 18];
  return (
    <>
      <Body>
        <Steps active={1} />
        <span className="eyebrow">Voice · step 2 of 3</span>
        <h2 className="serif-h" style={{ fontSize: 22, margin: "6px 0 4px" }}>Hold a gentle “ahh”</h2>
        <p style={{ fontSize: 15, color: "var(--ink-2)", margin: "0 0 8px", lineHeight: 1.5 }}>
          Comfortable and even — no need to be loud.
        </p>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <div style={{ position: "relative", width: 168, height: 168, display: "grid", placeItems: "center" }}>
            <svg width="168" height="168" viewBox="0 0 168 168" style={{ position: "absolute", inset: 0 }}>
              <circle cx="84" cy="84" r="78" fill="none" stroke="var(--paper-sunk)" strokeWidth="6" />
              <circle cx="84" cy="84" r="78" fill="none" stroke="var(--ginseng)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray="490" strokeDashoffset="196" transform="rotate(-90 84 84)" />
            </svg>
            <div style={{ width: 132, height: 132, borderRadius: 999, background: "var(--ginseng-wash)", display: "grid", placeItems: "center", color: "var(--ginseng-deep)" }}>
              <Ic.mic width={46} height={46} />
            </div>
          </div>
          <div className="tabnum" style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--ink-2)" }}>3 seconds left</div>
          <div className="wave">
            {bars.map((h, i) => <i key={i} style={{ height: h, opacity: 0.4 + (h / 80) }} />)}
          </div>
        </div>

        <div className="card flat wash" style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-2)" }}>
          <Ic.shield width={16} height={16} style={{ color: "var(--sage)", flex: "0 0 auto" }} />
          Your voice is analysed live and never recorded or saved.
        </div>
      </Body>
      <Nav active="tests" />
    </>
  );
}

/* ===================== EYE ===================== */
function EyeTest() {
  return (
    <>
      <Body>
        <Steps active={2} />
        <span className="eyebrow">Eye · step 3 of 3</span>
        <h2 className="serif-h" style={{ fontSize: 22, margin: "6px 0 4px" }}>Look at the page behind</h2>
        <p style={{ fontSize: 15, color: "var(--ink-2)", margin: "0 0 18px", lineHeight: 1.5 }}>
          Small dots will appear on the web page. Tap each one as soon as you see it.
        </p>

        <div className="card flat" style={{ padding: 16, background: "var(--paper-2)" }}>
          <div style={{ position: "relative", borderRadius: 12, height: 168, background: "linear-gradient(135deg,#FBF7EF,#F1ECE0)", border: "1px solid var(--line)", overflow: "hidden" }}>
            <div className="fp-l" style={{ position: "absolute", top: 20, left: 20, width: "55%", background: "#E7DFD0" }} />
            <div className="fp-l" style={{ position: "absolute", top: 40, left: 20, width: "72%" }} />
            <div className="fp-l" style={{ position: "absolute", top: 58, left: 20, width: "60%" }} />
            <div className="eye-dot" style={{ top: 96, left: 188, width: 30, height: 30 }} />
            <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", fontSize: 11.5, color: "var(--ink-3)" }}>your browser tab</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink-2)" }}>Dot 4 of 10</span>
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="dot" style={{ width: 8, height: 8, background: i < 3 ? "var(--ginseng)" : i === 3 ? "var(--saffron)" : "var(--paper-sunk)" }} />
            ))}
          </div>
        </div>
        <div className="track" style={{ marginTop: 12 }}><i style={{ width: "35%", background: "var(--ginseng)" }} /></div>

        <div style={{ flex: 1 }} />
        <p className="muted" style={{ fontSize: 12.5, textAlign: "center", margin: 0 }}>
          Keep this panel open — the dots show on the page beside it.
        </p>
      </Body>
      <Nav active="tests" />
    </>
  );
}

/* ===================== RESULT CARD ===================== */
function SecRow({ label, value, baseline, good }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0" }}>
      <span style={{ fontSize: 14.5, color: "var(--ink-2)" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="tabnum" style={{ fontSize: 15.5, fontWeight: 700, color: "var(--ink)" }}>{value}</span>
        <span style={{ fontSize: 12, color: good ? "var(--sage-deep)" : "var(--ink-3)" }}>{baseline}</span>
      </span>
    </div>
  );
}
function TypingResult() {
  return (
    <>
      <Body>
        <Steps active={1} />
        <div className="center-col">
          <span className="mrow-ic" style={{ background: "var(--ginseng-wash)", color: "var(--ginseng-deep)", width: 44, height: 44 }}><Ic.keyboard width={24} height={24} /></span>
          <span className="eyebrow" style={{ marginTop: 12 }}>Typing · result</span>
          <div className="tabnum" style={{ fontFamily: "var(--serif)", fontSize: 52, lineHeight: 1, margin: "10px 0 2px", color: "var(--ink)" }}>
            18.4<span style={{ fontSize: 20, color: "var(--ink-3)", fontFamily: "var(--sans)" }}>ms</span>
          </div>
          <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>rhythm variance</div>
          <div style={{ marginTop: 14 }}><StatusPill status="stable" /></div>
        </div>

        <p style={{ fontFamily: "var(--serif)", fontSize: 16.5, textAlign: "center", color: "var(--ink-2)", lineHeight: 1.5, margin: "18px 0 6px" }}>
          Steady and even — right in line with your usual rhythm.
        </p>

        <div className="card flat wash" style={{ marginTop: 8, padding: "4px 16px" }}>
          <SecRow label="Total time" value="4.2s" baseline="≈ usual" good />
          <div className="divider" />
          <SecRow label="Corrections" value="1" baseline="≈ usual" good />
          <div className="divider" />
          <SecRow label="Avg. dwell" value="68ms" baseline="≈ usual" good />
        </div>
        <p className="muted" style={{ fontSize: 11.5, textAlign: "center", margin: "10px 0 0" }}>Compared with your personal baseline (12 sessions)</p>

        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 }}>
          Next — Voice <Ic.arrow width={19} height={19} />
        </button>
      </Body>
      <Nav active="tests" />
    </>
  );
}

/* ===================== SESSION SUMMARY ===================== */
function SumRow({ Icon, label, value, status }) {
  const c = { stable: "var(--sage)", monitor: "var(--saffron)", flag: "var(--jujube)" }[status];
  const txt = { stable: "Stable", monitor: "Monitor", flag: "Flag" }[status];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0" }}>
      <span className="mrow-ic" style={{ background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-2)", width: 38, height: 38 }}><Icon width={20} height={20} /></span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>{label}</span>
        <span className="tabnum" style={{ display: "block", fontSize: 13, color: "var(--ink-3)" }}>{value}</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 700, color: c }}>
        <span className="dot" style={{ background: c }} />{txt}
      </span>
    </div>
  );
}
function SessionSummary() {
  return (
    <>
      <Body>
        <div className="center-col" style={{ marginTop: 4 }}>
          <Seal size={104} status="stable" />
          <h2 className="serif-h" style={{ fontSize: 25, margin: "16px 0 4px" }}>All done for today</h2>
          <p style={{ fontSize: 15.5, color: "var(--ink-2)", margin: 0, maxWidth: 260, lineHeight: 1.5 }}>
            Today looks <strong style={{ color: "var(--sage-deep)" }}>stable</strong>. Thank you for checking in, Mei.
          </p>
        </div>

        <div className="card flat" style={{ marginTop: 20, padding: "4px 16px" }}>
          <SumRow Icon={Ic.keyboard} label="Typing" value="18.4ms rhythm variance" status="stable" />
          <div className="divider" />
          <SumRow Icon={Ic.mic} label="Voice" value="0.82% jitter" status="stable" />
          <div className="divider" />
          <SumRow Icon={Ic.eye} label="Eye" value="232ms reaction" status="monitor" />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, fontSize: 13.5, color: "var(--ink-3)" }}>
          <Ic.flame width={16} height={16} style={{ color: "var(--saffron)" }} />
          Streak now <strong style={{ color: "var(--ink-2)" }}>13 days</strong>
        </div>

        <div style={{ flex: 1 }} />
        <button className="btn btn-primary">Back to home</button>
        <button className="btn btn-quiet" style={{ marginTop: 10 }}>View history</button>
      </Body>
      <Nav active="tests" />
    </>
  );
}

Object.assign(window, { Steps, TestsIntro, TypingTest, VoiceTest, EyeTest, TypingResult, SessionSummary });
