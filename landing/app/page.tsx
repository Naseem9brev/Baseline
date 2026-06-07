import InstallCTA from '@/components/InstallCTA';
import { REPO_URL, STORE_URL } from '@/lib/config';

const FEATURES = [
  {
    icon: '👁',
    title: 'Eyes & heart rate',
    body: 'A short camera check estimates heart rate (cloud rPPG, optional) and looks at blink and eye steadiness.',
  },
  {
    icon: '🎙',
    title: 'Voice',
    body: 'Hold an “ahhhh” for a few seconds. Jitter, shimmer and clarity are measured locally — no audio leaves your device.',
  },
  {
    icon: '⚡',
    title: 'Reaction',
    body: 'Quick tap, choice, memory and typing mini-tests for a simple snapshot of focus and speed.',
  },
  {
    icon: '🌱',
    title: 'Streak & trends',
    body: 'A growing plant rewards your streak, and a year grid plus sparklines show how your baseline drifts over time.',
  },
  {
    icon: '🩺',
    title: 'Doctor-friendly export',
    body: 'Generate a tidy PDF monitoring record for a GP appointment, or export raw JSON to back up and restore.',
  },
  {
    icon: '🔒',
    title: 'Private by design',
    body: 'Everything runs on your device. Nothing is uploaded unless you add your own optional AI key.',
  },
];

export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <span className="brand">
            <span className="brand-mark">B</span>
            Baseline
          </span>
          <a
            className="btn btn-ghost"
            style={{ padding: '9px 16px', fontSize: 15 }}
            href={STORE_URL || '#install'}
            {...(STORE_URL ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {STORE_URL ? 'Add to Chrome' : 'Install'}
          </a>
        </div>
      </header>

      <main>
        <section className="wrap hero">
          <p className="eyebrow">60 seconds a day</p>
          <h1 className="serif-h">Know your baseline.</h1>
          <p className="lede">
            Baseline is a private daily check-in for your eyes, voice, and reaction time. Spot
            changes early, build a streak, and bring a clear record to your doctor — all without
            your data ever leaving your device.
          </p>
          <InstallCTA />
        </section>

        <section className="wrap section">
          <div className="section-head">
            <p className="eyebrow">What it checks</p>
            <h2 className="serif-h">Three quick stations, one daily score</h2>
          </div>
          <div className="grid-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card feature">
                <div className="feature-ico" aria-hidden style={{ fontSize: 22 }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="wrap section" id="install">
          <div className="section-head">
            <p className="eyebrow">Install</p>
            <h2 className="serif-h">
              {STORE_URL ? 'One click from the Chrome Web Store' : 'Add it in a couple of steps'}
            </h2>
          </div>

          {STORE_URL ? (
            <div style={{ textAlign: 'center' }}>
              <InstallCTA />
            </div>
          ) : (
            <div className="steps">
              <div className="step">
                <span className="step-num">1</span>
                <p style={{ margin: 0 }}>
                  Download the latest build from{' '}
                  <a href={`${REPO_URL}/releases`} target="_blank" rel="noopener noreferrer">
                    GitHub releases
                  </a>{' '}
                  (or clone the repo and run <code>npm run build</code>).
                </p>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <p style={{ margin: 0 }}>
                  Open <code>chrome://extensions</code> and turn on <strong>Developer mode</strong>{' '}
                  (top-right).
                </p>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <p style={{ margin: 0 }}>
                  Click <strong>Load unpacked</strong> and select the{' '}
                  <code>.output/chrome-mv3</code> folder.
                </p>
              </div>
              <div className="step">
                <span className="step-num">4</span>
                <p style={{ margin: 0 }}>
                  Pin Baseline and click it to open the side panel. That’s it — do your first
                  check-in.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="wrap section">
          <div className="band">
            <p className="eyebrow" style={{ color: 'var(--ginseng-soft)' }}>
              Privacy first
            </p>
            <h2 className="serif-h" style={{ fontSize: 32, marginTop: 10 }}>
              Your health data stays yours
            </h2>
            <p className="muted" style={{ maxWidth: 560, margin: '14px auto 0', fontSize: 17 }}>
              Camera and microphone frames are processed locally and never stored. Only computed
              scores and a few numbers are saved — in your browser. No accounts, no tracking.
            </p>
            <p style={{ marginTop: 18 }}>
              <a className="btn btn-primary" href="/privacy">
                Read the privacy policy
              </a>
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap">
          <span>© {new Date().getFullYear()} Baseline · Provisional, not medical advice.</span>
          <span style={{ display: 'flex', gap: 18 }}>
            <a href="/privacy">Privacy</a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}
