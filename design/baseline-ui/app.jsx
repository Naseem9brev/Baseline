/* global window, ReactDOM */
const {
  React, Ic, Mark, Nav,
  OnbWelcome, OnbName, HomeCalm, HomeWarm, HomeClinical,
  TestsIntro, TypingTest, VoiceTest, EyeTest, TypingResult, SessionSummary,
  History, DriftHistory, ExportForm, ExportReady, Settings,
  Frame, ActivityGrid,
} = window;

/* ---------- hero: real chrome window with panel docked right ---------- */
function Hero() {
  return (
    <div className="browser">
      <div className="bw-top">
        <div className="bw-lights">
          <span className="bw-light" style={{ background: "#E0A19A" }} />
          <span className="bw-light" style={{ background: "#E6CB97" }} />
          <span className="bw-light" style={{ background: "#A9C3A0" }} />
        </div>
        <div className="bw-omni"><Ic.shield width={13} height={13} /> a quiet morning to read · the-leaflet.example</div>
        <Mark size={22} r={7} />
      </div>
      <div className="bw-body">
        <div className="bw-page">
          <div className="fp">
            <div className="fp-h" />
            <div className="fp-l" style={{ width: "92%" }} />
            <div className="fp-l" style={{ width: "86%" }} />
            <div className="fp-l" style={{ width: "94%" }} />
            <div className="fp-img" />
            <div className="fp-l" style={{ width: "78%", marginTop: 24 }} />
            <div className="fp-l" style={{ width: "88%" }} />
            <div className="fp-l" style={{ width: "60%" }} />
          </div>
        </div>
        <div className="bw-dock">
          <div className="sp-bar">
            <div className="sp-bar-l">
              <Mark size={20} r={6} />
              <span className="sp-name">Baseline</span>
              <span className="sp-caret"><Ic.caret width={15} height={15} /></span>
            </div>
            <span className="sp-x"><Ic.x width={15} height={15} /></span>
          </div>
          <div className="app"><HomeCalm streak={12} /></div>
        </div>
      </div>
    </div>
  );
}

/* ---------- system reference ---------- */
function Swatch({ c, name, hex, dark }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 96 }}>
      <div style={{ height: 64, borderRadius: 12, background: c, border: "1px solid rgba(0,0,0,.06)" }} />
      <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 8 }}>{name}</div>
      <div className="tabnum" style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{hex}</div>
    </div>
  );
}
function SystemStrip() {
  return (
    <div className="section">
      <div className="sec-head">
        <span className="sec-num">00</span>
        <h2 className="sec-title">The system</h2>
        <span className="sec-line" />
        <p className="sec-note">Dried-herb tones over warm paper — calm, never clinical.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 28 }}>
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Palette · the apothecary shelf</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Swatch c="var(--ginseng)" name="Saffron" hex="#B8772B" />
            <Swatch c="var(--saffron)" name="Amber" hex="#9C6B3F" />
            <Swatch c="var(--sage)" name="Sage" hex="#6B7355" />
            <Swatch c="var(--jujube)" name="Jujube" hex="#8A3A3A" />
            <Swatch c="var(--plum)" name="Plum" hex="#6E5773" />
            <Swatch c="var(--paper)" name="Paper" hex="#F7F3EC" />
          </div>
          <div className="divider" style={{ margin: "20px 0 16px" }} />
          <div className="eyebrow" style={{ marginBottom: 12 }}>Status, reskinned</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span className="pill st-stable"><span className="dot" />Stable · sage</span>
            <span className="pill st-monitor"><span className="dot" />Monitor · amber</span>
            <span className="pill st-flag"><span className="dot" />Flag · jujube</span>
          </div>
        </div>
        <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Type</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 38, lineHeight: 1, letterSpacing: "-.01em" }}>Spectral</div>
          <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 17, color: "var(--ginseng)", marginTop: 4 }}>a clear line on how you’re doing</div>
          <div className="divider" style={{ margin: "16px 0" }} />
          <div style={{ fontFamily: "var(--sans)", fontSize: 26, fontWeight: 700 }}>Hanken Grotesk</div>
          <p style={{ fontFamily: "var(--sans)", fontSize: 15, color: "var(--ink-2)", lineHeight: 1.55, margin: "8px 0 0" }}>
            Humanist and highly legible — body text never drops below 18px, with generous touch targets for every age.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- section wrapper ---------- */
function Section({ num, title, note, children }) {
  return (
    <div className="section">
      <div className="sec-head">
        <span className="sec-num">{num}</span>
        <h2 className="sec-title">{title}</h2>
        <span className="sec-line" />
        {note && <p className="sec-note">{note}</p>}
      </div>
      <div className="gallery">{children}</div>
    </div>
  );
}

function App() {
  return (
    <div className="stage">
      <div className="wrap">
        <header className="masthead">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Mark size={34} r={10} />
            <span className="mast-kicker">Baseline · UI direction</span>
          </div>
          <h1 className="mast-title">A daily health check-in<br />that feels like <em>tea, not a test.</em></h1>
          <p className="mast-sub">
            A redesign of the Baseline Chrome side panel. Three sixty-second checks — typing, voice, and eye —
            wrapped in the muted tones of a traditional herb shelf. Quietly clinical, warmly human.
          </p>
        </header>

        <div className="hero"><Hero /></div>

        <SystemStrip />

        <Section num="01" title="Onboarding" note="A calm welcome — no account, nothing to learn.">
          <Frame title="Welcome" desc="The brand seal sets a meditative tone; privacy stated up front.">
            <div className="app"><OnbWelcome /></div>
          </Frame>
          <Frame title="Your name" desc="One friendly detail so each morning feels personal.">
            <div className="app"><OnbName /></div>
          </Frame>
        </Section>

        <Section num="02" title="Home — the calm direction" note="Chosen: Direction A. The plant is your streak — it grows a little with every day you check in.">
          <Frame title="Day 12 · steady growth" desc="A status seal becomes a living one. No numbers shouting — just a plant, a count, and one clear action.">
            <div className="app"><HomeCalm streak={12} /></div>
          </Frame>
          <Frame title="Day 3 · a new seedling" desc="Early on, the plant is a sprout. The same screen, fewer days in.">
            <div className="app"><HomeCalm streak={3} /></div>
          </Frame>
          <Frame title="Day 64 · in flower" desc="Keep the streak and the plant matures and blooms — a quiet reward for showing up.">
            <div className="app"><HomeCalm streak={64} /></div>
          </Frame>
        </Section>

        <Section num="03" title="The daily check-in" note="Typing → Voice → Eye. Encouraging copy, never a pass or fail.">
          <Frame title="Intro" desc="Three steps previewed; expectations set gently.">
            <div className="app"><TestsIntro /></div>
          </Frame>
          <Frame title="1 · Typing" desc="Live character match in the serif; we measure how, not what.">
            <div className="app"><TypingTest /></div>
          </Frame>
          <Frame title="2 · Voice" desc="A five-second “ahh” with a calm progress ring; nothing recorded.">
            <div className="app"><VoiceTest /></div>
          </Frame>
          <Frame title="3 · Eye" desc="Dots appear on the page behind the panel; the panel guides.">
            <div className="app"><EyeTest /></div>
          </Frame>
          <Frame title="Result" desc="Primary metric large, secondary readings vs. personal baseline.">
            <div className="app"><TypingResult /></div>
          </Frame>
          <Frame title="Summary" desc="Three readings, an overall status, and the streak ticks up.">
            <div className="app"><SessionSummary /></div>
          </Frame>
        </Section>

        <Section num="04" title="History & trends" note="A GitHub-style year in herb tones, plus gentle trend lines.">
          <Frame title="Your record" desc="Streak stats, the activity grid, and 30-day trend sparklines.">
            <div className="app"><History /></div>
          </Frame>
          <Frame title="Drift alert" desc="A non-alarming nudge in saffron when something edges up.">
            <div className="app"><DriftHistory /></div>
          </Frame>
        </Section>

        <Section num="05" title="GP export" note="One page the user chooses to share — never automatic.">
          <Frame title="Prepare" desc="Name, optional DOB, and exactly what the report will contain.">
            <div className="app"><ExportForm /></div>
          </Frame>
          <Frame title="Ready" desc="Saved locally; printed or on a phone for the appointment.">
            <div className="app"><ExportReady /></div>
          </Frame>
        </Section>

        <Section num="06" title="Settings" note="Reminders, spoken guidance, and a clear privacy promise.">
          <Frame title="Settings" desc="Calm toggles; data controls; private-by-design reassurance.">
            <div className="app"><Settings /></div>
          </Frame>
        </Section>

        <footer style={{ marginTop: 72, paddingTop: 28, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12, color: "var(--ink-3)", fontSize: 13.5 }}>
          <Mark size={24} r={7} />
          Baseline — provisional, not medical advice. Everything stays on the device.
        </footer>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
