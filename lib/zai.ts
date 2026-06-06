import { getZaiApiKey } from './settings';

const ZAI_BASE = 'https://api.z.ai/api/paas/v4/chat/completions';
const DEFAULT_MODEL = 'glm-5.1';
const TIMEOUT_MS = 30_000;

export interface ZaiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Call GLM 5.1 via Z.AI. Returns null if no key or request fails. */
export async function chatCompletion(
  messages: ZaiMessage[],
  options?: { model?: string; temperature?: number },
): Promise<string | null> {
  const apiKey = await getZaiApiKey();
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ZAI_BASE, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en',
      },
      body: JSON.stringify({
        model: options?.model ?? DEFAULT_MODEL,
        messages,
        temperature: options?.temperature ?? 0.4,
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
