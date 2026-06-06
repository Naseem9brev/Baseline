import { getGeminiApiKey } from './settings';
import type { LlmMessage } from './zai';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';
const TIMEOUT_MS = 30_000;

/** Call Gemini via Google AI. Returns null if no key or request fails. */
export async function geminiChatCompletion(
  messages: LlmMessage[],
  options?: { model?: string; temperature?: number },
): Promise<string | null> {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) return null;

  const systemMsg = messages.find((m) => m.role === 'system');
  const convMessages = messages.filter((m) => m.role !== 'system');

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);

  const model = options?.model ?? DEFAULT_MODEL;
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(systemMsg
          ? { systemInstruction: { parts: [{ text: systemMsg.content }] } }
          : {}),
        contents: convMessages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          temperature: options?.temperature ?? 0.4,
        },
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}
