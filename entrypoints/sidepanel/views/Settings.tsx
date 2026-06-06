import { useEffect, useState } from 'react';
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
    hint: 'Powers GLM 5.1 voice result summaries and GP export text. Only metrics are sent — never audio.',
    link: { href: 'https://z.ai/', text: 'Get Z.AI API key →' },
    placeholder: 'Paste your Z.AI key',
  },
  {
    key: 'elevenLabsApiKey',
    label: 'ElevenLabs API key (optional)',
    hint: 'Only needed if you add spoken test instructions later.',
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Settings
        </p>

        <div className="mt-4 space-y-5">
          {FIELDS.map(({ key, label, hint, link, placeholder }) => (
            <div key={key}>
              <label
                htmlFor={key}
                className="block text-sm font-medium text-slate-700"
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
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none ring-teal-500/30 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2"
              />
              {link ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-block text-xs font-medium text-teal-600 hover:text-teal-700"
                >
                  {link.text}
                </a>
              ) : null}
              {hint ? <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{hint}</p> : null}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => void persist()}
          className="mt-6 min-h-12 w-full rounded-xl bg-teal-600 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Save settings
        </button>

        {saved ? (
          <p className="mt-2 text-center text-xs text-emerald-600">Settings saved.</p>
        ) : null}
      </div>

      <p className="text-center text-[11px] leading-relaxed text-slate-400">
        API keys are stored only on this device in Chrome local storage. Voice analysis
        (jitter, shimmer, HNR) always runs locally with praatfan — no key required.
      </p>
    </div>
  );
}
