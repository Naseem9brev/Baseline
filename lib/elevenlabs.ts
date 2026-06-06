import {
  getElevenLabsApiKey,
  getElevenLabsVoiceId,
} from './settings';

const TTS_BASE = 'https://api.elevenlabs.io/v1/text-to-speech';
/** Rachel — calm, clear default for instruction audio. */
export const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
const MODEL_ID = 'eleven_multilingual_v2';
const TIMEOUT_MS = 25_000;

export type SpeakResult =
  | { status: 'played' }
  | { status: 'no_key' }
  | { status: 'api_error'; detail: string }
  | { status: 'playback_blocked' };

type TtsProxyResponse =
  | { ok: true; audio: number[] }
  | { ok: false; status?: number; body?: string; error?: string };

let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let cachedBlob: Blob | null = null;
let cachedText: string | null = null;

export function stopInstructions(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
}

function userMessageForApiStatus(status: number, body: string): string {
  if (status === 401) return 'Invalid ElevenLabs API key — check Settings.';
  if (status === 403) return 'API key lacks Text to Speech access — enable it in ElevenLabs.';
  if (status === 404) return 'Voice not found — clear the voice ID in Settings or pick a valid one.';
  if (status === 422) return 'ElevenLabs rejected the request — check your voice ID and plan.';
  const snippet = body.slice(0, 120).trim();
  return snippet ? `ElevenLabs error (${status}): ${snippet}` : `ElevenLabs error (${status}).`;
}

function fetchTtsViaBackground(
  apiKey: string,
  voiceId: string,
  text: string,
): Promise<TtsProxyResponse> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      resolve({ ok: false, error: 'ElevenLabs timed out — try again.' });
    }, TIMEOUT_MS);

    chrome.runtime.sendMessage(
      {
        type: 'baseline:elevenlabs-tts',
        apiKey,
        voiceId,
        text,
        modelId: MODEL_ID,
      },
      (response: TtsProxyResponse | undefined) => {
        window.clearTimeout(timer);
        if (chrome.runtime.lastError) {
          console.error('[elevenlabs] background message failed:', chrome.runtime.lastError);
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response ?? { ok: false, error: 'No response from extension background.' });
      },
    );
  });
}

async function fetchTtsBlob(text: string): Promise<{ blob: Blob } | SpeakResult> {
  const apiKey = await getElevenLabsApiKey();
  if (!apiKey) return { status: 'no_key' };

  const voiceId = (await getElevenLabsVoiceId()) ?? DEFAULT_VOICE_ID;
  const proxy = await fetchTtsViaBackground(apiKey, voiceId, text);

  if (!proxy.ok) {
    if (proxy.status) {
      console.error('[elevenlabs] TTS failed:', proxy.status, proxy.body);
      return {
        status: 'api_error',
        detail: userMessageForApiStatus(proxy.status, proxy.body ?? ''),
      };
    }
    console.error('[elevenlabs] TTS proxy error:', proxy.error);
    return {
      status: 'api_error',
      detail: proxy.error ?? 'Could not reach ElevenLabs.',
    };
  }

  const blob = new Blob([new Uint8Array(proxy.audio)], { type: 'audio/mpeg' });
  if (!blob.size) {
    return { status: 'api_error', detail: 'ElevenLabs returned empty audio.' };
  }

  return { blob };
}

async function playBlob(
  blob: Blob,
  hooks?: { onPlaybackStart?: () => void },
): Promise<SpeakResult> {
  stopInstructions();

  const url = URL.createObjectURL(blob);
  currentUrl = url;

  return await new Promise<SpeakResult>((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;

    const finish = (result: SpeakResult) => {
      stopInstructions();
      resolve(result);
    };

    audio.onended = () => finish({ status: 'played' });
    audio.onerror = () => finish({ status: 'api_error', detail: 'Audio playback failed.' });

    hooks?.onPlaybackStart?.();
    void audio.play().catch((err: unknown) => {
      console.error('[elevenlabs] playback blocked:', err);
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError') {
        finish({ status: 'playback_blocked' });
      } else {
        finish({ status: 'api_error', detail: 'Could not play instruction audio.' });
      }
    });
  });
}

/** Fetch ElevenLabs TTS and play. Call on mount after eye check or on button click. */
export async function speakInstructions(
  text: string,
  hooks?: { onPlaybackStart?: () => void },
): Promise<SpeakResult> {
  if (cachedBlob && cachedText === text) {
    return playBlob(cachedBlob, hooks);
  }

  const fetched = await fetchTtsBlob(text);
  if (!('blob' in fetched)) return fetched;

  cachedBlob = fetched.blob;
  cachedText = text;
  return playBlob(fetched.blob, hooks);
}

/** Quick check used by Settings — does not play audio. */
export async function testElevenLabsConnection(): Promise<SpeakResult> {
  const sample = 'Baseline voice check is connected.';
  const result = await fetchTtsBlob(sample);
  if ('blob' in result) {
    return { status: 'played' };
  }
  return result;
}
