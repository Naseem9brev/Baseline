import { useState } from 'react';
import { saveSettings } from '@/lib/settings';
import Brand from './Brand';
import { Ic } from './icons';
import ReminderControls from './ReminderControls';

// First-run flow: a short welcome + privacy promise, then pick a daily reminder.
export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [enabled, setEnabled] = useState(true);
  const [hour, setHour] = useState(9);
  const [saving, setSaving] = useState(false);

  async function finish() {
    setSaving(true);
    await saveSettings({
      onboardingComplete: true,
      reminderEnabled: enabled,
      reminderHour: hour,
    });
    onDone();
  }

  return (
    <div className="app">
      <main className="app-scroll center-col" style={{ justifyContent: 'center', gap: 0 }}>
        {step === 0 ? (
          <>
            <Brand size={56} radius={16} />
            <h1 className="serif-h" style={{ fontSize: 26, margin: '16px 0 6px' }}>
              Welcome to Baseline
            </h1>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 300 }}>
              A 60-second daily check-in — eyes, voice, and reaction — that helps you notice
              changes over time.
            </p>

            <div className="card flat wash" style={{ marginTop: 18, width: '100%', textAlign: 'left' }}>
              <div className="flex items-center gap-3">
                <span
                  className="grid place-items-center rounded-xl"
                  style={{ width: 38, height: 38, background: 'var(--sage-soft)', color: 'var(--sage-deep)', flex: '0 0 auto' }}
                >
                  <Ic.shield width={20} height={20} />
                </span>
                <div>
                  <p className="serif-h" style={{ fontSize: 15 }}>
                    100% on your device
                  </p>
                  <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                    Your readings stay in this browser. Nothing is uploaded unless you add your
                    own AI key.
                  </p>
                </div>
              </div>
            </div>

            <button onClick={() => setStep(1)} className="btn btn-primary" style={{ marginTop: 18 }}>
              Get started
            </button>
          </>
        ) : (
          <>
            <span
              className="grid place-items-center rounded-2xl"
              style={{ width: 56, height: 56, background: 'var(--ginseng-wash)', color: 'var(--ginseng-deep)' }}
            >
              <Ic.bell width={28} height={28} />
            </span>
            <h1 className="serif-h" style={{ fontSize: 24, margin: '16px 0 6px' }}>
              Stay on track
            </h1>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.55, maxWidth: 300 }}>
              A daily nudge makes the habit stick. Pick a time that suits you — you can change
              it anytime in Settings.
            </p>

            <div className="card" style={{ marginTop: 18, width: '100%', textAlign: 'left' }}>
              <ReminderControls
                enabled={enabled}
                hour={hour}
                onChange={(next) => {
                  setEnabled(next.enabled);
                  setHour(next.hour);
                }}
              />
            </div>

            <button
              onClick={() => void finish()}
              disabled={saving}
              className="btn btn-primary"
              style={{ marginTop: 18 }}
            >
              {saving ? 'Setting up…' : 'Start using Baseline'}
            </button>
            <button onClick={() => setStep(0)} className="btn btn-quiet" style={{ marginTop: 8 }}>
              Back
            </button>
          </>
        )}
      </main>
    </div>
  );
}
