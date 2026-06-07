'use client';

import { useEffect } from 'react';
import { REPO_URL, STORE_URL } from '@/lib/config';

const storeHref = STORE_URL || '#install';
const ext = STORE_URL ? { target: '_blank', rel: 'noopener noreferrer' } : {};
const repoExt = { target: '_blank', rel: 'noopener noreferrer' } as const;
// Until the Web Store listing is live, the CTA leads to the install steps.
const ctaLabel = STORE_URL ? 'Add to Chrome' : 'How to install';
const ctaLabelLong = STORE_URL ? 'Add to Chrome — free' : 'How to install';

export default function Home() {
  useEffect(() => {
    const header = document.getElementById('top');
    const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    const show = (el: Element) => {
      el.classList.add('in');
      el.querySelectorAll('.spark-path').forEach((p) => p.classList.add('in'));
    };
    const inView = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top < (window.innerHeight || 0) * 0.94 && r.bottom > 0;
    };

    let io: IntersectionObserver | undefined;
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(show);
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              show(e.target);
              io?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
      );
      items.forEach((el) => (inView(el) ? show(el) : io!.observe(el)));
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      io?.disconnect();
    };
  }, []);

  return (
    <>
      {/* ============ HEADER ============ */}
      <header id="top">
        <div className="wrap">
          <nav className="nav" aria-label="Primary">
            <a className="brand" href="#top" aria-label="Baseline home">
              <span className="mark" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 18h16" stroke="#fbf3e6" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 18c0-4 0-7 0-9" stroke="#fbf3e6" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 11c-2.6.2-4.2-1.1-4.6-3.4 2.5-.3 4.1.8 4.6 3.4Z" fill="#fbf3e6" />
                  <path d="M12 9c1.9-1.6 3.9-1.7 5.7-.5-1.3 2-3.2 2.5-5.7.5Z" fill="#fbf3e6" />
                </svg>
              </span>
              Baseline
            </a>
            <div className="nav-links">
              <a className="muted" href="#checks">What it checks</a>
              <a className="muted" href="#how">How it works</a>
              <a className="muted" href="#privacy">Your data</a>
              <a className="btn btn-primary" href={storeHref} {...ext}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 4v11M7 11l5 4 5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                {ctaLabel}
              </a>
            </div>
          </nav>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow reveal">60 seconds a day</span>
            <h1 className="reveal" data-d="1">
              Know your<br />
              <span className="em">baseline.</span>
            </h1>
            <p className="lede reveal" data-d="2">
              A quiet daily check-in — eyes, voice, reaction — that builds a baseline and a streak
              that grows like a plant.
            </p>
            <div className="hero-cta reveal" data-d="3">
              <a className="btn btn-primary" href={storeHref} {...ext}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 4v11M7 11l5 4 5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                {ctaLabelLong}
              </a>
              <a className="btn-link" href={REPO_URL} {...repoExt}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 4 4 12l5 8M15 4l5 8-5 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                View source
              </a>
            </div>
            <p className="hero-trust reveal" data-d="4">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3.5 5.5 6v5.5c0 4 2.8 7 6.5 8.5 3.7-1.5 6.5-4.5 6.5-8.5V6L12 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Your data stays on your device.
            </p>
          </div>

          {/* hero art: side-panel mockup with growing plant */}
          <div className="hero-art reveal" data-d="2" aria-hidden="true">
            <svg className="floaty f1" viewBox="0 0 24 24" fill="none">
              <path d="M5 19c0-7 5-12 14-13 .5 7-3 14-11 14a6 6 0 0 1-3-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8 16c3-3 6-5 9-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <svg className="floaty f2" viewBox="0 0 24 24" fill="none">
              <path d="M5 19c0-7 5-12 14-13 .5 7-3 14-11 14a6 6 0 0 1-3-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M8 16c3-3 6-5 9-6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <div className="panel">
              <div className="panel-bar">
                <span className="l">
                  <span className="mk" style={{ background: 'var(--ginseng)' }} /> Baseline
                </span>
                <span className="dots">
                  <i style={{ background: '#e0a19a' }} />
                  <i style={{ background: '#e6cb97' }} />
                  <i style={{ background: '#a9c3a0' }} />
                </span>
              </div>
              <div className="panel-body">
                <div className="p-date">Thursday · 7 June</div>
                <div className="p-greet">Good morning, Mei</div>
                <div className="plantwrap">
                  <svg className="plant" width="150" height="158" viewBox="0 0 160 168" fill="none" role="img" aria-label="A plant that grows with your streak">
                    <ellipse cx="80" cy="92" rx="44" ry="48" fill="var(--ginseng-wash)" opacity=".5" />
                    <path d="M22 152 H138" stroke="var(--ginseng)" strokeWidth="3" strokeLinecap="round" />
                    <ellipse cx="80" cy="152" rx="26" ry="5.5" fill="var(--ginseng-soft)" opacity=".7" />
                    <path className="stem" d="M80 152 C75 118, 85 96, 80 56" stroke="var(--sage-deep)" strokeWidth="3" strokeLinecap="round" />
                    <path className="leaf l1" d="M81.5 128 Q90 112 100 117 Q90 130 81.5 128 Z" fill="var(--sage)" />
                    <path className="leaf l2" d="M78.5 116 Q70 100 60 105 Q70 118 78.5 116 Z" fill="var(--sage)" />
                    <path className="leaf l3" d="M81.5 102 Q91 87 101 92 Q90 104 81.5 102 Z" fill="var(--sage)" />
                    <path className="leaf l4" d="M78.5 90 Q69 76 60 81 Q70 92 78.5 90 Z" fill="var(--sage)" />
                    <path className="leaf l5" d="M81 78 Q90 66 99 70 Q89 80 81 78 Z" fill="var(--sage)" />
                    <path className="crown" d="M80 44 C73 50 74 62 80 62 C86 62 87 50 80 44 Z" fill="var(--ginseng)" />
                  </svg>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div className="p-count" style={{ justifyContent: 'center' }}>
                    <b className="tabnum">12</b>
                    <span>days growing</span>
                  </div>
                  <div className="p-word">your longest yet</div>
                  <span className="pill">
                    <i /> Stable
                  </span>
                </div>
                <div className="p-cta">
                  <span className="ic">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h3l2 5 4-10 2 5h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span>
                    <b>Begin today&rsquo;s check-in</b>
                    <small>Keep your plant growing · ~60s</small>
                  </span>
                  <span className="go">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHAT IT CHECKS ============ */}
      <section id="checks" className="band">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">A 60-second ritual</span>
            <h2>
              Three small stations.<br />One clear baseline.
            </h2>
            <p className="lede">
              Each morning, three gentle checks take a reading of how you&rsquo;re doing today —
              compared only to your own history. No pass or fail, just a pattern worth noticing.
            </p>
          </div>
          <div className="cards">
            <article className="card reveal" data-d="1">
              <span className="tag">Station 01</span>
              <div className="cic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.6" />
                  <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
              <h3>Eyes &amp; heart rate</h3>
              <p>
                A short camera check estimates your pulse from tiny color shifts in your skin, and
                watches blink rhythm and eye steadiness.
              </p>
            </article>
            <article className="card reveal" data-d="2">
              <span className="tag">Station 02</span>
              <div className="cic">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Voice</h3>
              <p>
                Hold a gentle &ldquo;ahhhh&rdquo; for a few seconds. Baseline measures pitch jitter,
                shimmer and clarity — a quiet window into how steady your voice is today.
              </p>
            </article>
            <article className="card reveal" data-d="3">
              <span className="tag">Station 03</span>
              <div className="cic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h3l2 5 4-10 2 5h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Reaction</h3>
              <p>
                Tap, choice, memory and typing mini-tests catch the small day-to-day shifts in focus
                and response that you&rsquo;d never notice on your own.
              </p>
            </article>

            <article className="card sage reveal" data-d="1">
              <div className="cic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 19c0-7 5-12 14-13 .5 7-3 14-11 14a6 6 0 0 1-3-1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M8 16c3-3 6-5 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Streak &amp; trends</h3>
              <p>
                One daily baseline score, a streak that grows as a little plant, a year activity grid
                and trend sparklines — your progress, gently visible.
              </p>
              <svg className="mini-spark" width="150" height="40" viewBox="0 0 150 40" fill="none" aria-hidden="true">
                <path className="spark-path" d="M4 30 L24 26 L44 28 L64 20 L84 22 L104 14 L124 16 L146 8" stroke="var(--sage)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </article>
            <article className="card sage reveal" data-d="2">
              <div className="cic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20V4a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M13.5 3.5V8h4M9.5 13h5M9.5 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <h3>Doctor-friendly export</h3>
              <p>
                Turn months of check-ins into a clean one-page PDF for your GP — or back up and
                restore everything as a simple JSON file you control.
              </p>
            </article>
            <article className="card sage reveal" data-d="3">
              <div className="cic">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 11V8a7 7 0 0 1 14 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <rect x="4" y="11" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
              <h3>Stays on your device</h3>
              <p>
                Your check-ins are saved on your device — Baseline doesn&rsquo;t upload or store your
                data anywhere else.
              </p>
              <div className="mini-grid" aria-hidden="true">
                <i style={{ background: 'var(--paper-sunk)' }} />
                <i style={{ background: 'var(--sage)' }} />
                <i style={{ background: 'var(--sage)' }} />
                <i style={{ background: 'var(--ginseng)' }} />
                <i style={{ background: 'var(--sage)' }} />
                <i style={{ background: 'var(--sage)' }} />
                <i style={{ background: 'var(--paper-sunk)' }} />
                <i style={{ background: 'var(--sage)' }} />
                <i style={{ background: 'var(--jujube)' }} />
                <i style={{ background: 'var(--sage)' }} />
                <i style={{ background: 'var(--sage)' }} />
                <i style={{ background: 'var(--ginseng)' }} />
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section
        id="how"
        className="band"
        style={{ background: 'var(--paper-2)', borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)' }}
      >
        <div className="wrap">
          <div className="sec-head center reveal">
            <span className="eyebrow">How it works</span>
            <h2>A rhythm you&rsquo;ll keep.</h2>
            <p className="lede">
              Built into your browser&rsquo;s side panel, so it&rsquo;s there when you start your day
              — and gone in a minute.
            </p>
          </div>
          <div className="steps">
            <div className="step reveal" data-d="1">
              <span className="line" />
              <div className="n">Step one</div>
              <h3>Open the side panel</h3>
              <p>Click the Baseline icon. It opens beside whatever you&rsquo;re reading — no new tab, no context-switch.</p>
            </div>
            <div className="step reveal" data-d="2">
              <span className="line" />
              <div className="n">Step two</div>
              <h3>Take the 60-second check</h3>
              <p>Move through eyes, voice and reaction at your own pace. Calm prompts, no jargon, nothing to get wrong.</p>
            </div>
            <div className="step reveal" data-d="3">
              <div className="n">Step three</div>
              <h3>See your trends grow</h3>
              <p>Watch today&rsquo;s baseline, your streak plant, and the gentle lines that show where you&rsquo;re heading.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ INSTALL ============ */}
      <section id="install" className="band">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">Get Baseline</span>
            <h2>Install in a few steps.</h2>
            <p className="lede">
              {STORE_URL
                ? 'Two ways in — straight from the Chrome Web Store, or build it yourself from source.'
                : 'Baseline is open source. Clone the repo, build it, and load it into Chrome — about five minutes.'}
            </p>
          </div>
          <div className="install-grid">
            <div className={'install-card reveal' + (STORE_URL ? '' : ' featured')} data-d="1">
              <span className="badge soft">From source</span>
              <h3>Clone, build &amp; load it</h3>
              <p>Run these in a terminal, then load the built folder into Chrome.</p>
              <ol className="olist">
                <li>
                  Clone the repo:{' '}
                  <code>git clone https://github.com/Naseem9brev/Baseline</code>
                </li>
                <li>Install dependencies: <code>npm install</code></li>
                <li>Build the extension: <code>npm run build</code></li>
                <li>
                  Open <code>chrome://extensions</code> and turn on{' '}
                  <strong>Developer mode</strong> (top-right).
                </li>
                <li>
                  Click <strong>Load unpacked</strong> and choose the{' '}
                  <code>.output/chrome-mv3</code> folder.
                </li>
                <li>Pin Baseline, click it to open the side panel, and do your first check-in.</li>
              </ol>
              <a className="btn btn-ghost" href={REPO_URL} {...repoExt} style={{ marginTop: 22 }}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 4 4 12l5 8M15 4l5 8-5 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Open the repo on GitHub
              </a>
            </div>

            {STORE_URL ? (
              <div className="install-card featured reveal" data-d="2">
                <span className="badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M12 8h9M8.5 14l-4.5 7M15.5 14l-4.5 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  Recommended
                </span>
                <h3>From the Chrome Web Store</h3>
                <p>One click, automatic updates, ready to pin to your toolbar.</p>
                <a className="btn btn-primary" href={storeHref} {...ext} aria-label="Add Baseline to Chrome" style={{ marginTop: 20 }}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 4v11M7 11l5 4 5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                  Add to Chrome
                </a>
              </div>
            ) : (
              <div className="install-card reveal" data-d="2">
                <span className="badge soft">Coming soon</span>
                <h3>Chrome Web Store</h3>
                <p>
                  A one-click &ldquo;Add to Chrome&rdquo; listing is on the way. Until then, the steps
                  on the left get you running in a few minutes.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ DATA BAND ============ */}
      <section id="privacy" className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="privacy reveal">
            <span className="eyebrow">On your device</span>
            <h2>Your data stays on your device.</h2>
            <p>
              Baseline saves your check-ins locally in your browser. It doesn&rsquo;t upload or store
              your data anywhere else.
            </p>
            <a className="btn-link" href="/privacy">
              Read the privacy policy{' '}
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="wrap">
          <div className="foot">
            <a className="brand" href="#top" aria-label="Baseline home">
              <span className="mark" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 18h16" stroke="#fbf3e6" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 18c0-4 0-7 0-9" stroke="#fbf3e6" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 11c-2.6.2-4.2-1.1-4.6-3.4 2.5-.3 4.1.8 4.6 3.4Z" fill="#fbf3e6" />
                  <path d="M12 9c1.9-1.6 3.9-1.7 5.7-.5-1.3 2-3.2 2.5-5.7.5Z" fill="#fbf3e6" />
                </svg>
              </span>
              Baseline
            </a>
            <div className="links">
              <a href="#privacy">Your data</a>
              <a href={REPO_URL} {...repoExt}>GitHub</a>
              <a href="#install">Install</a>
            </div>
          </div>
          <p className="disclaimer">
            © 2026 Baseline. <strong>Provisional, not medical advice.</strong> Baseline is a wellness
            tool for everyday self-awareness, not a medical device, and does not diagnose, treat or
            prevent any condition. If something concerns you, talk to a qualified clinician.
          </p>
        </div>
      </footer>
    </>
  );
}
