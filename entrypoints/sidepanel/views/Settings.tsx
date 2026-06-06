import { useEffect, useState } from 'react';
import VoiceStation from '../stations/VoiceStation';
import { testElevenLabsConnection } from '@/lib/elevenlabs';
import {
  DEFAULT_SETTINGS,
  getSettings,
  onSettingsChanged,
  saveSettings,
  type AppSettings,
} from '@/lib/settings';

const FIELDS: {
  key: keyof AppSettings;
  label: string;
  hint?: string;
  link?: { href: string; text: string };
  placeholder?: string;
}[] = [
  {
    key: 'zaiApiKey',
    label: 'Z.AI API key',
    hint: 'Powers GLM 5.1 summaries for voice results and check-in reviews. Only metrics are sent — never audio or video.',
    link: { href: 'https://z.ai/', text: 'Get Z.AI API key →' },
    placeholder: 'Paste your Z.AI key',
  },
  {
    key: 'vitalLensApiKey',
    label: 'VitalLens API key',
    hint: 'Enables accurate heart rate in the eye test (cloud rPPG). Pixelated 40×40 face frames are sent to VitalLens and deleted after processing.',
    link: { href: 'https://www.rouast.com/api/', text: 'Get VitalLens API key →' },
    placeholder: 'Paste your VitalLens key',
  },
  {
    key: 'geminiApiKey',
    label: 'Gemini API key',
    hint: 'Alternative to Z.AI — used when no Z.AI key is saved. Same summaries and reviews; only your numbers are sent.',
    link: { href: 'https://aistudio.google.com/apikey', text: 'Get Gemini API key →' },
    placeholder: 'Paste your Google AI key',
  },
  {
    key: 'elevenLabsApiKey',
    label: 'ElevenLabs API key (optional)',
    hint: 'Speaks voice-check instructions aloud before you record. Only the instruction text is sent — no health data.',
    link: { href: 'https://elevenlabs.io/', text: 'Get ElevenLabs API key →' },
    placeholder: 'Optional',
  },
  {
    key: 'elevenLabsVoiceId',
    label: 'ElevenLabs voice ID (optional)',
    placeholder: 'e.g. 21m00Tcm4TlvDq8ikWAM',
  },
];

export default function SettingsView() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [voiceTestOpen, setVoiceTestOpen] = useState(false);
  const [voiceTestKey, setVoiceTestKey] = useState(0);
  const [ttsTest, setTtsTest] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [ttsTestMessage, setTtsTestMessage] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
    return onSettingsChanged(setSettings);
  }, []);

  async function updateField(key: keyof AppSettings, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function persist() {
    await saveSettings(settings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  async function testReadAloud() {
    setTtsTest('testing');
    setTtsTestMessage(null);
    await persist();
    const result = await testElevenLabsConnection();
    if (result.status === 'played') {
      setTtsTest('ok');
      setTtsTestMessage('ElevenLabs connected — open the voice test and tap Hear instructions.');
      return;
    }
    setTtsTest('fail');
    setTtsTestMessage(
      result.status === 'no_key'
        ? 'No API key saved yet.'
        : result.status === 'api_error'
          ? result.detail
          : 'Connection OK but playback was blocked.',
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-3)]">
          Settings
        </p>

        <div className="mt-4 space-y-5">
          {FIELDS.map(({ key, label, hint, link, placeholder }) => (
            <div key={key}>
              <label
                htmlFor={key}
                className="block text-sm font-medium text-[var(--ink)]"
              >
                {label}
              </label>
              <input
                id={key}
                type={key.includes('ApiKey') ? 'password' : 'text'}
                autoComplete="off"
                spellCheck={false}
                value={settings[key]}
                placeholder={placeholder}
                onChange={(e) => void updateField(key, e.target.value)}
                onBlur={() => void persist()}
                className="mt-1.5 w-full rounded-lg border border-[var(--ink-4)] bg-[var(--paper-2)] px-3 py-2.5 text-sm text-[#34302B] outline-none ring-[var(--ginseng)]/30 placeholder:text-[var(--ink-3)] focus:border-[var(--ginseng)] focus:ring-2"
              />
              {link ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-block text-xs font-medium text-[var(--ginseng)] hover:text-[var(--ginseng-deep)]"
                >
                  {link.text}
                </a>
              ) : null}
              {hint ? <p className="mt-1 text-[11px] leading-relaxed text-[var(--ink-2)]">{hint}</p> : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void persist()}
          className="mt-6 min-h-12 w-full rounded-xl bg-[var(--ginseng)] text-sm font-semibold text-white hover:bg-[var(--ginseng-deep)]"
        >
          Save settings
        </button>

        {saved ? (
          <p className="mt-2 text-center text-xs text-[var(--sage-deep)]">Settings saved.</p>
        ) : null}

        <button
          type="button"
          disabled={ttsTest === 'testing' || !settings.elevenLabsApiKey.trim()}
          onClick={() => void testReadAloud()}
          className="mt-4 min-h-11 w-full rounded-lg border border-[var(--ink-4)] bg-white text-sm font-medium text-[var(--ink)] hover:bg-[var(--paper-2)] disabled:opacity-50"
        >
          {ttsTest === 'testing' ? 'Testing ElevenLabs…' : 'Test ElevenLabs connection'}
        </button>
        {ttsTestMessage ? (
          <p
            className={
              'mt-2 text-center text-xs ' +
              (ttsTest === 'ok' ? 'text-[var(--sage-deep)]' : 'text-[var(--ink-2)]')
            }
          >
            {ttsTestMessage}
          </p>
        ) : null}
      </div>

      <p className="text-center text-[11px] leading-relaxed text-[var(--ink-3)]">
        API keys are stored only on this device in Chrome local storage. Voice analysis
        (jitter, shimmer, HNR) always runs locally with praatfan — no key required.
        Add Z.AI or Gemini for AI-written summaries.
      </p>

      <div className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-[var(--ink)]">Try voice test</p>
        <p className="mt-1 text-xs text-[var(--ink-2)]">
          Run the sustained “ahhhh” check without starting a full check-in.
        </p>
        {!voiceTestOpen ? (
          <button
            type="button"
            onClick={() => {
              setVoiceTestOpen(true);
              setVoiceTestKey((k) => k + 1);
            }}
            className="mt-3 min-h-11 w-full rounded-lg border border-[var(--ginseng-soft)] bg-[var(--ginseng-wash)] text-sm font-semibold text-[var(--ginseng-deep)] hover:bg-[var(--ginseng-wash)]"
          >
            Open voice test
          </button>
        ) : (
          <div className="mt-3 space-y-3">
            <VoiceStation
              key={voiceTestKey}
              onComplete={() => setVoiceTestOpen(false)}
              onError={() => setVoiceTestKey((k) => k + 1)}
            />
            <button
              type="button"
              onClick={() => setVoiceTestOpen(false)}
              className="w-full rounded-lg border border-[var(--ink-4)] py-2 text-sm text-[var(--ink-2)] hover:bg-[var(--paper-2)]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
