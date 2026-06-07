/** User-provided API keys — stored in chrome.storage.local, never in the build. */

export interface AppSettings {
  /** Z.AI platform key for GLM 5.1 (voice summaries, GP narrative). */
  zaiApiKey: string;
  /** VitalLens API key (cloud rPPG) for accurate heart rate in the eye test. */
  vitalLensApiKey: string;
  /** Google AI key for Gemini (alternative to GLM for summaries). */
  geminiApiKey: string;
  /** Optional ElevenLabs key if you add spoken instructions later. */
  elevenLabsApiKey: string;
  /** ElevenLabs voice ID (optional). */
  elevenLabsVoiceId: string;
  /** Whether the daily check-in reminder notification is on. */
  reminderEnabled: boolean;
  /** Hour of day (0–23, local time) the daily reminder fires. */
  reminderHour: number;
  /** Whether the first-run onboarding has been completed. */
  onboardingComplete: boolean;
}

const KEY = 'baseline:settings';

export const DEFAULT_SETTINGS: AppSettings = {
  zaiApiKey: '',
  vitalLensApiKey: '',
  geminiApiKey: '',
  elevenLabsApiKey: '',
  elevenLabsVoiceId: '',
  reminderEnabled: true,
  reminderHour: 9,
  onboardingComplete: false,
};

export async function getSettings(): Promise<AppSettings> {
  const res = await chrome.storage.local.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(res[KEY] as Partial<AppSettings> | undefined) };
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await getSettings()), ...partial };
  await chrome.storage.local.set({ [KEY]: next });
  return next;
}

export async function getZaiApiKey(): Promise<string | null> {
  const key = (await getSettings()).zaiApiKey.trim();
  return key || null;
}

export async function getVitalLensApiKey(): Promise<string | null> {
  const key = (await getSettings()).vitalLensApiKey.trim();
  return key || null;
}

export async function getGeminiApiKey(): Promise<string | null> {
  const key = (await getSettings()).geminiApiKey.trim();
  return key || null;
}

export async function getElevenLabsApiKey(): Promise<string | null> {
  const stored = (await getSettings()).elevenLabsApiKey.trim();
  if (stored) return stored;
  const env = import.meta.env.VITE_ELEVENLABS_API_KEY?.trim();
  return env || null;
}

export async function getElevenLabsVoiceId(): Promise<string | null> {
  const id = (await getSettings()).elevenLabsVoiceId.trim();
  return id || null;
}

export function onSettingsChanged(cb: (settings: AppSettings) => void): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area === 'local' && changes[KEY]) {
      cb({ ...DEFAULT_SETTINGS, ...(changes[KEY].newValue as Partial<AppSettings>) });
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
