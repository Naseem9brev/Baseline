import { geminiChatCompletion } from './gemini';
import { getSettings } from './settings';
import { glmChatCompletion, type LlmMessage } from './zai';

export type { LlmMessage };

export type LlmProvider = 'glm' | 'gemini';

/** Prefer GLM when both keys are saved. */
export async function getLlmProvider(): Promise<LlmProvider | null> {
  const settings = await getSettings();
  if (settings.zaiApiKey.trim()) return 'glm';
  if (settings.geminiApiKey.trim()) return 'gemini';
  return null;
}

export async function hasLlmKey(): Promise<boolean> {
  return (await getLlmProvider()) !== null;
}

export function llmProviderLabel(provider: LlmProvider): string {
  return provider === 'glm' ? 'GLM 5.1' : 'Gemini';
}

/** Route to GLM or Gemini based on saved Settings keys. */
export async function llmChatCompletion(
  messages: LlmMessage[],
  options?: { model?: string; temperature?: number },
): Promise<{ text: string | null; provider: LlmProvider | null }> {
  const provider = await getLlmProvider();
  if (!provider) return { text: null, provider: null };

  const text =
    provider === 'glm'
      ? await glmChatCompletion(messages, options)
      : await geminiChatCompletion(messages, options);

  return { text, provider };
}
