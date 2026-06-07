import type { Metadata } from 'next';
import { REPO_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy Policy — Baseline',
  description: 'How Baseline handles your data: it stays on your device.',
};

export default function Privacy() {
  return (
    <main className="wrap prose">
      <p className="eyebrow">Baseline</p>
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: 2026</p>

      <p>
        Baseline is a Chrome extension that runs a short daily health check-in. It is built so your
        data stays with you.
      </p>

      <h2>Your data stays on your device</h2>
      <p>
        Your check-in history is saved locally in your browser&rsquo;s extension storage. Baseline
        does not upload or store your data anywhere else, and the camera and microphone used for the
        eye and voice checks are processed on your device — not recorded. Your data is removed if you
        uninstall the extension or clear its browsing data.
      </p>

      <h2>Optional features you turn on</h2>
      <p>
        Some optional features call an external service using an API key you provide in Settings. When
        you enable one, the minimum data needed is sent directly from your browser to that provider —
        for example, a heart-rate estimate or an AI-written summary of your numbers. If you don&rsquo;t
        add any keys, these features stay off.
      </p>

      <h2>Medical disclaimer</h2>
      <p>
        Baseline gives provisional, non-clinical readings for personal trend tracking. It is not a
        medical device and not a substitute for professional medical advice.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Open an issue on{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>

      <p style={{ marginTop: 32 }}>
        <a className="btn btn-ghost" href="/">
          ← Back to home
        </a>
      </p>
    </main>
  );
}
