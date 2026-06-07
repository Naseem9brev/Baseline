import type { Metadata } from 'next';
import { REPO_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy Policy — Baseline',
  description: 'How Baseline handles your data: everything stays on your device.',
};

export default function Privacy() {
  return (
    <main className="wrap prose">
      <p className="eyebrow">Baseline</p>
      <h1>Privacy Policy</h1>
      <p className="muted">Last updated: 2026</p>

      <p>
        Baseline is a Chrome extension that runs a short daily health check-in. It is built to keep
        your data on your own device. This policy explains exactly what is and isn’t collected.
      </p>

      <h2>What stays on your device</h2>
      <p>
        Camera and microphone frames used for the eye and voice checks are processed locally in your
        browser and are <strong>never uploaded or stored</strong>. Your check-in history — combined
        scores and a few numeric features (never photos, video, or audio) — is saved only in your
        browser’s local extension storage (<code>chrome.storage.local</code>). It is removed if you
        uninstall the extension or clear its browsing data.
      </p>

      <h2>What we don’t do</h2>
      <ul>
        <li>No accounts, sign-in, or user profiles.</li>
        <li>No analytics, tracking, advertising, or third-party trackers.</li>
        <li>No selling or sharing of data — there is no server that receives your data.</li>
      </ul>

      <h2>Optional third-party services (only if you opt in)</h2>
      <p>
        Some optional features call external APIs <em>using a key you provide</em> in Settings. When
        enabled, only the minimum data needed is sent, directly from your browser to that provider:
      </p>
      <ul>
        <li>
          <strong>Heart-rate estimate (VitalLens):</strong> small, pixelated face frames are sent to
          process heart rate and are deleted after processing. Only if you add a VitalLens key.
        </li>
        <li>
          <strong>AI summaries (Z.AI or Google Gemini):</strong> only your numeric results are sent —
          never audio or video. Only if you add a key.
        </li>
        <li>
          <strong>Spoken instructions (ElevenLabs):</strong> only the instruction text is sent. Only
          if you add a key.
        </li>
      </ul>
      <p>
        If you don’t add any keys, Baseline runs fully offline. Your API keys are stored only on your
        device.
      </p>

      <h2>Permissions</h2>
      <p>
        The extension requests only what it needs to function: local storage, alarms and
        notifications (for your daily reminder), the side panel, downloads (for your PDF/JSON
        export), and tabs (to open the panel). Camera and microphone use the browser’s standard
        prompt and are not background permissions.
      </p>

      <h2>Medical disclaimer</h2>
      <p>
        Baseline provides provisional, non-clinical readings for personal trend tracking. It is not a
        medical device and not a substitute for professional advice.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests? Open an issue on{' '}
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
