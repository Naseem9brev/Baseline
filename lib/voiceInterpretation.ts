import type { RawVoiceFeatures } from './analysis/types';
import { chatCompletion } from './zai';
import {
  scoreVoiceMetrics,
  VOICE_STATUS_LABEL,
  type VoiceMetricScores,
  type VoiceMetricStatus,
} from './voiceScoring';

const METRIC_MEANING = {
  jitter:
    'Jitter measures how steady your pitch was — like whether the note wobbled while you held “ahhhh”. Lower is steadier.',
  shimmer:
    'Shimmer measures how steady your loudness was — whether the volume faded or jumped. Lower is more even.',
  hnr:
    'HNR (clarity) measures how “clean” the vowel sounded versus breathy or noisy. Higher usually means a clearer tone.',
  mpt:
    'Phonation time is simply how long you kept the “ahhhh” going. We track whether that gets easier or harder over weeks.',
} as const;

function explainMetric(
  key: keyof VoiceMetricScores,
  metrics: RawVoiceFeatures,
  scores: VoiceMetricScores,
): string {
  const status = scores[key];
  const label = VOICE_STATUS_LABEL[status];

  switch (key) {
    case 'jitter':
      return (
        `${METRIC_MEANING.jitter} Yours was ${metrics.jitter}% (${label}). ` +
        (status === 'stable'
          ? 'That’s in a typical steady range for today.'
          : status === 'monitor'
            ? 'There was a little more wobble than the steadiest readings — one day like this is usually nothing to worry about.'
            : 'There was noticeably more pitch variation than usual — if that keeps showing up, mention it at a routine appointment.')
      );
    case 'shimmer':
      return (
        `${METRIC_MEANING.shimmer} Yours was ${metrics.shimmer}% (${label}). ` +
        (status === 'stable'
          ? 'Your volume stayed fairly even — good sign for this check.'
          : status === 'monitor'
            ? 'Volume shifted a bit more than the steadiest days — tiredness or background noise can do that.'
            : 'Volume varied more than we’d expect for a steady vowel — worth watching if it repeats.')
      );
    case 'hnr':
      return (
        `${METRIC_MEANING.hnr} Yours was ${metrics.hnr} dB (${label}). ` +
        (status === 'stable'
          ? 'That suggests a clear, steady tone today.'
          : status === 'monitor'
            ? 'Clarity was a little lower than the best readings — a quiet room and a relaxed voice help next time.'
            : 'The recording sounded breathier or noisier than the clearest range — often room noise or a dry throat; mention it to your GP only if it stays low over many days.')
      );
    case 'mpt':
      return (
        `${METRIC_MEANING.mpt} You held it for ${metrics.mptSec} seconds (${label}). ` +
        (status === 'stable'
          ? 'That’s a solid length for this daily check.'
          : status === 'monitor'
            ? 'A bit shorter than the longest comfortable holds — try a deeper breath before you start, with no need to push.'
            : 'Shorter than we’d expect if you were fully comfortable — again, trends over time matter more than one try.')
      );
    default:
      return '';
  }
}

function overallTakeaway(scores: VoiceMetricScores): string {
  const headline = VOICE_STATUS_LABEL[scores.overall];

  if (scores.overall === 'stable') {
    return (
      `Overall (${headline}): today’s “ahhhh” looked steady across the board. ` +
      'Keep doing this check at the same time of day when you can — we’re building your personal pattern, not giving a diagnosis.'
    );
  }
  if (scores.overall === 'monitor') {
    return (
      `Overall (${headline}): one or two readings sat outside the steadiest range, but nothing alarming on its own. ` +
      'Compare the next few days before drawing any conclusions — a single session rarely tells the whole story.'
    );
  }
  return (
    `Overall (${headline}): several readings were outside the steadiest range today. ` +
    'That does not mean something is wrong — it means worth watching. If similar results show up over many check-ins, mention them at a routine GP or therapy appointment.'
  );
}

/** Plain-English fallback when GLM is unavailable. */
export function buildPlainEnglishSummary(
  metrics: RawVoiceFeatures,
  scores?: VoiceMetricScores,
): string {
  const s = scores ?? scoreVoiceMetrics(metrics);

  const paragraphs = [
    'You held “ahhhh” while we measured pitch steadiness, volume steadiness, voice clarity, and how long you could sustain the sound. These numbers come from the same kind of voice check used in speech therapy — they help track change over time, not diagnose illness on their own.',
    explainMetric('jitter', metrics, s),
    explainMetric('shimmer', metrics, s),
    explainMetric('hnr', metrics, s),
    explainMetric('mpt', metrics, s),
    overallTakeaway(s),
  ];

  return paragraphs.join('\n\n');
}

const GLM_SYSTEM_PROMPT =
  'You explain sustained vowel (“ahhhh”) voice check results to an older adult or family carer in the UK. ' +
  'Write in warm, plain English — no clinical jargon without a one-sentence explanation. ' +
  'For each metric, say what it measures in everyday words, quote their actual number and status label, ' +
  'and what that might mean for them today (without diagnosing). ' +
  'Cover: jitter (% pitch wobble), shimmer (% volume unevenness), HNR (dB voice clarity), phonation time (seconds). ' +
  'End with a calm overall takeaway and remind them that patterns over many days matter more than one reading. ' +
  'Never say they have a disease. Use 4–6 short paragraphs separated by blank lines.';

/** GLM 5.1 summary when a Z.AI key is saved; null if unavailable or request fails. */
export async function fetchGlmVoiceSummary(
  metrics: RawVoiceFeatures,
): Promise<string | null> {
  const scores = scoreVoiceMetrics(metrics);

  return chatCompletion([
    { role: 'system', content: GLM_SYSTEM_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'sustained /a/ phonation',
        metrics,
        statusLabels: {
          jitter: VOICE_STATUS_LABEL[scores.jitter],
          shimmer: VOICE_STATUS_LABEL[scores.shimmer],
          hnr: VOICE_STATUS_LABEL[scores.hnr],
          mpt: VOICE_STATUS_LABEL[scores.mpt],
          overall: VOICE_STATUS_LABEL[scores.overall],
        },
        meaningGuide: METRIC_MEANING,
      }),
    },
  ]);
}

/** Instant fallback plus optional GLM upgrade. */
export async function interpretVoiceResult(
  metrics: RawVoiceFeatures,
): Promise<{ summary: string; usedAi: boolean }> {
  const fallback = buildPlainEnglishSummary(metrics);
  const ai = await fetchGlmVoiceSummary(metrics);
  if (ai) return { summary: ai, usedAi: true };
  return { summary: fallback, usedAi: false };
}

export { METRIC_MEANING, explainMetric, type VoiceMetricStatus };
