/* global window */
const { Ic, Nav, StatusPill, Body, Sparkline, ActivityGrid, GridLegend } = window;

/* ===================== HISTORY ===================== */
function HistStat({ value, label, sub }) {
  return (
    <div className="card flat" style={{ padding: "13px 10px", textAlign: "center" }}>
      <div className="tabnum serif-h" style={{ fontSize: 26 }}>{value}</div>
      <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 1, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 10.5, color: "var(--ink-4)" }}>{sub}</div>
    </div>
  );
}
function TrendRow({ Icon, label, value, status, data, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
      <span className="mrow-ic" style={{ background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-2)", width: 34, height: 34 }}><Icon width={18} height={18} /></span>
      <span style={{ width: 58 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span className="tabnum" style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)" }}>{value}</span>
      </span>
      <span style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}><Sparkline data={data} color={color} w={120} h={34} /></span>
      <span className="dot" style={{ background: color }} />
    </div>
  );
}
function History() {
  return (
    <>
      <Body>
        <h2 className="serif-h" style={{ fontSize: 24, margin: "0 0 2px" }}>Your record</h2>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", margin: "0 0 16px" }}>A quiet line through the months.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          <HistStat value="13" label="Streak" sub="days" />
          <HistStat value="146" label="Check-ins" sub="all time" />
          <HistStat value="91%" label="Stable" sub="of days" />
        </div>

        <div className="card" style={{ marginTop: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="eyebrow">Past year</span>
            <StatusPill status="stable" />
          </div>
          <ActivityGrid weeks={28} cell={10} gap={3} />
          <div style={{ marginTop: 12 }}><GridLegend /></div>
        </div>

        <div className="card" style={{ marginTop: 14, padding: "6px 16px 10px" }}>
          <div className="eyebrow" style={{ margin: "12px 0 2px" }}>Trends over 30 days</div>
          <TrendRow Icon={Ic.keyboard} label="Typing" value="18.4 ms" status="stable" color="var(--sage)" data={[28, 24, 26, 22, 23, 20, 21, 19, 20, 18.4]} />
          <div className="divider" />
          <TrendRow Icon={Ic.mic} label="Voice" value="0.82 %" status="stable" color="var(--sage)" data={[1.2, 1.0, 1.1, 0.9, 0.95, 0.88, 0.9, 0.8, 0.85, 0.82]} />
          <div className="divider" />
          <TrendRow Icon={Ic.eye} label="Eye" value="232 ms" status="monitor" color="var(--saffron)" data={[208, 212, 210, 216, 215, 222, 220, 226, 229, 232]} />
        </div>

        <button className="btn btn-ghost" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 16 }}>
          <Ic.doc width={19} height={19} style={{ color: "var(--ginseng)" }} /> Export for GP appointment
        </button>
      </Body>
      <Nav active="history" />
    </>
  );
}

/* ===================== DRIFT ALERT (history sub-state) ===================== */
function DriftHistory() {
  return (
    <>
      <Body>
        <h2 className="serif-h" style={{ fontSize: 24, margin: "0 0 14px" }}>Your record</h2>
        <div className="card" style={{ padding: 16, border: "1px solid var(--saffron)", background: "var(--saffron-soft)" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <span className="mrow-ic" style={{ background: "var(--saffron)", color: "#FBF3E6", width: 38, height: 38, flex: "0 0 auto" }}><Ic.spark width={20} height={20} /></span>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: "#7A5320" }}>A gentle nudge</div>
              <p style={{ fontSize: 14, color: "#6F4D1F", lineHeight: 1.5, margin: "4px 0 0" }}>
                Your eye reaction time has edged up over the last week. It’s nothing alarming — worth keeping an eye on, and easy to mention at your next visit.
              </p>
            </div>
          </div>
          <button className="btn" style={{ background: "#FBF3E6", color: "#7A5320", border: "1px solid var(--saffron)", marginTop: 14, fontSize: 15 }}>
            Add to GP summary
          </button>
        </div>

        <div className="card" style={{ marginTop: 14, padding: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Eye reaction · last 14 days</div>
          <Sparkline data={[210, 212, 214, 215, 220, 222, 219, 226, 228, 231, 233, 236, 240, 242]} color="var(--saffron)" w={344} h={70} />
        </div>
      </Body>
      <Nav active="history" />
    </>
  );
}

/* ===================== GP EXPORT ===================== */
function ExportForm() {
  return (
    <>
      <Body>
        <button className="sp-x" style={{ marginLeft: -4, color: "var(--ink-2)" }}><Ic.back width={20} height={20} /></button>
        <span className="eyebrow" style={{ marginTop: 6, display: "block" }}>For your GP</span>
        <h2 className="serif-h" style={{ fontSize: 24, margin: "6px 0 4px" }}>Prepare a summary</h2>
        <p style={{ fontSize: 14.5, color: "var(--ink-2)", lineHeight: 1.55, margin: "0 0 20px" }}>
          A one-page PDF with your trends and a plain-language note — only what you choose to share.
        </p>

        <label className="eyebrow" style={{ display: "block", marginBottom: 7 }}>Patient name</label>
        <input className="input" defaultValue="Mei Lin Chen" style={{ marginBottom: 14 }} />
        <label className="eyebrow" style={{ display: "block", marginBottom: 7 }}>Date of birth <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--ink-4)", fontWeight: 500 }}>· optional</span></label>
        <input className="input" placeholder="DD / MM / YYYY" style={{ marginBottom: 16 }} />

        <div className="card flat wash" style={{ padding: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>This report includes</div>
          {["146 check-ins over the past year", "Typing, voice & eye trend charts", "One flagged change to discuss"].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 0", fontSize: 14, color: "var(--ink-2)" }}>
              <Ic.check width={16} height={16} style={{ color: "var(--sage)", flex: "0 0 auto" }} />{t}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 18 }}>
          <Ic.doc width={19} height={19} /> Create PDF
        </button>
        <p className="muted" style={{ fontSize: 11.5, textAlign: "center", margin: "10px 0 0", lineHeight: 1.5 }}>
          Generated on your device · not a diagnostic tool
        </p>
      </Body>
      <Nav active="history" />
    </>
  );
}

function ExportReady() {
  return (
    <>
      <Body>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <span className="mrow-ic" style={{ background: "var(--sage-soft)", color: "var(--sage-deep)", width: 56, height: 56, borderRadius: 16 }}><Ic.check width={30} height={30} /></span>
          <h2 className="serif-h" style={{ fontSize: 24, margin: "18px 0 4px" }}>Your report is ready</h2>
          <p style={{ fontSize: 15, color: "var(--ink-2)", margin: 0, maxWidth: 250, lineHeight: 1.5 }}>
            Saved to your downloads. Bring it printed or on your phone.
          </p>

          <div className="card" style={{ marginTop: 24, padding: 14, width: "100%", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
            <span className="mrow-ic" style={{ background: "var(--jujube-soft)", color: "var(--jujube)", width: 42, height: 50, borderRadius: 8 }}><Ic.doc width={22} height={22} /></span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14.5, fontWeight: 700 }}>baseline-summary-jun.pdf</span>
              <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)" }}>2 pages · 148 KB</span>
            </span>
            <Ic.arrow width={20} height={20} style={{ color: "var(--ginseng)" }} />
          </div>
        </div>
        <button className="btn btn-primary">Done</button>
        <button className="btn btn-quiet" style={{ marginTop: 10 }}>Open report</button>
      </Body>
      <Nav active="history" />
    </>
  );
}

/* ===================== SETTINGS ===================== */
function ToggleRow({ Icon, title, desc, on }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 0" }}>
      <span className="mrow-ic" style={{ background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink-2)", width: 36, height: 36 }}><Icon width={19} height={19} /></span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>{title}</span>
        <span style={{ display: "block", fontSize: 13, color: "var(--ink-3)", marginTop: 1 }}>{desc}</span>
      </span>
      <span style={{ width: 44, height: 26, borderRadius: 999, background: on ? "var(--sage)" : "var(--paper-sunk)", position: "relative", flex: "0 0 auto" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: 999, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
      </span>
    </div>
  );
}
function Settings() {
  return (
    <>
      <Body>
        <h2 className="serif-h" style={{ fontSize: 24, margin: "0 0 18px" }}>Settings</h2>

        <div className="card flat" style={{ padding: "2px 16px" }}>
          <ToggleRow Icon={Ic.bell} title="Daily reminder" desc="A gentle nudge at 9:00 AM" on={true} />
          <div className="divider" />
          <ToggleRow Icon={Ic.mic} title="Read instructions aloud" desc="Spoken guidance for each step" on={true} />
          <div className="divider" />
          <ToggleRow Icon={Ic.spark} title="Drift alerts" desc="Notice gradual changes early" on={true} />
        </div>

        <div className="card" style={{ marginTop: 14, padding: 16, display: "flex", gap: 12, background: "var(--sage-soft)", border: "1px solid #CBD2BC" }}>
          <Ic.shield width={22} height={22} style={{ color: "var(--sage-deep)", flex: "0 0 auto" }} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--sage-deep)" }}>Private by design</div>
            <p style={{ fontSize: 13.5, color: "#4D5440", lineHeight: 1.5, margin: "3px 0 0" }}>
              Camera and microphone are processed on your device and never uploaded. Only numbers are stored.
            </p>
          </div>
        </div>

        <div className="eyebrow" style={{ margin: "22px 0 8px" }}>Your data</div>
        <button className="btn btn-quiet" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Ic.doc width={17} height={17} /> Export raw data (JSON)
        </button>
        <button className="btn btn-quiet" style={{ marginTop: 10, color: "var(--jujube)", borderColor: "var(--jujube-soft)" }}>
          Delete all data
        </button>
      </Body>
      <Nav active="home" />
    </>
  );
}

Object.assign(window, { History, DriftHistory, ExportForm, ExportReady, Settings });
