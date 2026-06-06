import { combineScore } from './analysis/score';
import type {
  RawFeatures,
  StationKey,
  StationScore,
} from './analysis/types';
import { reactionSubScores } from './analysis/placeholder';
import { llmChatCompletion, type LlmProvider } from './llm';
import {
  extractHeartRate,
  formatStatus,
  overallSessionStatus,
  scoreBlinkRate,
  scoreHeartRate,
  scoreReactionMs,
} from './reportMetrics';
import { scoreVoiceMetrics, VOICE_STATUS_LABEL } from './voiceScoring';

const SESSION_SYSTEM_PROMPT =
  'You review a daily home health check-in for an older UK adult in very simple language. ' +
  'The check-in has three parts: eye check (heart rate, blink rate), sustained “ahhhh” voice, and reaction mini-tests (tap speed, arrow choice, memory, typing). ' +
  'Write 4–6 short lines: one each for eye, voice, and reaction where data exists, then one overall takeaway. ' +
  'Use their exact numbers and status labels. Never diagnose. Under 120 words. Blank line between lines.';

function buildPlainEnglishSessionSummary(
  stations: Partial<Record<StationKey, StationScore>>,
  raw: RawFeatures,
): string {
  const { baselineScore } = combineScore(stations);
  const lines: string[] = [`Overall baseline score: ${baselineScore}/100.`];

  const hr = extractHeartRate(raw.face, stations.face?.note);
  if (hr) {
    lines.push(
      `Eye check — heart rate ${hr} bpm (${formatStatus(scoreHeartRate(hr))}). ` +
        (raw.face?.blinkRate
          ? `Blink rate about ${Math.round(raw.face.blinkRate)}/min (${formatStatus(scoreBlinkRate(raw.face.blinkRate))}).`
          : ''),
    );
  } else if (stations.face) {
    lines.push(`Eye check: ${stations.face.note}`);
  }

  if (raw.voice) {
    const voiceScores = scoreVoiceMetrics(raw.voice);
    lines.push(
      `Voice — jitter ${raw.voice.jitter}%, shimmer ${raw.voice.shimmer}%, clarity ${raw.voice.hnr} dB, held ${raw.voice.mptSec}s (${VOICE_STATUS_LABEL[voiceScores.overall]}).`,
    );
  } else if (stations.voice) {
    lines.push(`Voice: ${stations.voice.note}`);
  }

  if (raw.reaction) {
    const sub = reactionSubScores(raw.reaction);
    lines.push(
      `Reaction — tap ${Math.round(raw.reaction.reactionMs)} ms, choice ${Math.round(raw.reaction.choiceReactionMs)} ms, ` +
        `memory ${raw.reaction.memoryMaxLength}, typing ${raw.reaction.wpm} wpm (combined score ${sub.tap}/${sub.choice}/${sub.memory}/${sub.wpm}).`,
    );
  } else if (stations.reaction) {
    lines.push(`Reaction: ${stations.reaction.note}`);
  }

  const sessionStatus = overallSessionStatus({
    date: '',
    baselineScore,
    stations,
    raw,
    feedback: '',
    createdAt: 0,
  });
  lines.push(
    sessionStatus === 'stable'
      ? 'Overall: readings look steady today — keep checking at the same time each day.'
      : sessionStatus === 'monitor'
        ? 'Overall: a few readings were slightly off — compare the next few days before worrying.'
        : 'Overall: several readings were outside the usual range — mention the trend at a routine GP visit if it continues.',
  );

  return lines.join('\n\n');
}

/** AI-written check-in review when a GLM or Gemini key is saved. */
export async function fetchAiSessionSummary(
  stations: Partial<Record<StationKey, StationScore>>,
  raw: RawFeatures,
): Promise<{ summary: string; usedAi: boolean; provider: LlmProvider | null }> {
  const fallback = buildPlainEnglishSessionSummary(stations, raw);
  const { baselineScore } = combineScore(stations);

  const voiceScores = raw.voice ? scoreVoiceMetrics(raw.voice) : null;
  const hr = extractHeartRate(raw.face, stations.face?.note);

  const { text, provider } = await llmChatCompletion([
    { role: 'system', content: SESSION_SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        baselineScore,
        stations,
        raw,
        statusLabels: {
          session: formatStatus(
            overallSessionStatus({
              date: '',
              baselineScore,
              stations,
              raw,
              feedback: '',
              createdAt: 0,
            }),
          ),
          heartRate: hr ? formatStatus(scoreHeartRate(hr)) : null,
          blinkRate: raw.face?.blinkRate
            ? formatStatus(scoreBlinkRate(raw.face.blinkRate))
            : null,
          voice: voiceScores
            ? {
                jitter: VOICE_STATUS_LABEL[voiceScores.jitter],
                shimmer: VOICE_STATUS_LABEL[voiceScores.shimmer],
                hnr: VOICE_STATUS_LABEL[voiceScores.hnr],
                mpt: VOICE_STATUS_LABEL[voiceScores.mpt],
                overall: VOICE_STATUS_LABEL[voiceScores.overall],
              }
            : null,
          reaction: raw.reaction
            ? {
                tap: formatStatus(scoreReactionMs(raw.reaction.reactionMs, 'tap')),
                choice: formatStatus(
                  scoreReactionMs(raw.reaction.choiceReactionMs, 'choice'),
                ),
              }
            : null,
        },
      }),
    },
  ]);

  if (text) return { summary: text, usedAi: true, provider };
  return { summary: fallback, usedAi: false, provider: null };
}

export { buildPlainEnglishSessionSummary };
