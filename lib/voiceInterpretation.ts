import type { RawVoiceFeatures } from './analysis/types';
import { chatCompletion } from './zai';
import {
  scoreVoiceMetrics,
  VOICE_STATUS_LABEL,
  type VoiceMetricScores,
  type VoiceMetricStatus,
} from './voiceScoring';

const METRIC_MEANING = {
  jitter: 'pitch steadiness — how much your note wobbled',
  shimmer: 'volume steadiness — how even your loudness stayed',
  hnr: 'voice clarity — how clean vs breathy the tone sounded',
  mpt: 'breath support — how long you could comfortably hold the sound',
} as const;

/** Rotates volume-specific monitor explanations so repeat checks don't feel repetitive. */
function shimmerMonitorReason(shimmer: number): string {
  const reasons = [
    'Volume wavered slightly — moving your head or changing distance from the mic can do that.',
    'Loudness dipped a little mid-sound — uneven breath pressure is a common cause, not usually worrying once.',
    'Some ups and downs in volume — speaking softly then pushing louder often shows up here; one check is enough to note it.',
  ];
  return reasons[Math.floor(shimmer * 10) % reasons.length];
}

function explainMetric(
  key: keyof VoiceMetricScores,
  metrics: RawVoiceFeatures,
  scores: VoiceMetricScores,
): string {
  const status = scores[key];

  switch (key) {
    case 'jitter':
      return (
        `Pitch (${metrics.jitter}%): ` +
        (status === 'stable'
          ? 'Your note held steady — the muscles controlling your voice are working smoothly today.'
          : status === 'monitor'
            ? 'A little wobble in the note — common if you rushed the start or your voice is not warmed up yet.'
            : 'Clear pitch wavering — your voice may be overused or recovering; rest it and mention this if it keeps happening.')
      );
    case 'shimmer':
      return (
        `Volume (${metrics.shimmer}%): ` +
        (status === 'stable'
          ? 'Your loudness stayed level — good control of breath pressure through the whole sound.'
          : status === 'monitor'
            ? shimmerMonitorReason(metrics.shimmer)
            : 'Loudness dropped or jumped noticeably — often uneven breath support or fading before you meant to stop; watch if it repeats.')
      );
    case 'hnr':
      return (
        `Clarity (${metrics.hnr} dB): ` +
        (status === 'stable'
          ? 'A clean, clear tone — little background noise or breathiness in the recording.'
          : status === 'monitor'
            ? 'Slightly husky or airy — congestion, a recent cold, or room echo can soften clarity.'
            : 'Quite breathy or weak-sounding — if you feel fine, retry in a quiet room; see your GP if this persists.')
      );
    case 'mpt':
      return (
        `Breath support (${metrics.mptSec}s): ` +
        (status === 'stable'
          ? 'You sustained the sound comfortably — your lungs and breath control coped well today.'
          : status === 'monitor'
            ? 'You finished a bit sooner than ideal — try a slower, deeper breath in before you start.'
            : 'You stopped early — may reflect breathlessness, discomfort, or simply unfamiliarity with the task; one try is not enough to tell.')
      );
    default:
      return '';
  }
}

function overallTakeaway(scores: VoiceMetricScores): string {
  if (scores.overall === 'stable') {
    return 'Overall: Your voice looked steady today. Keep checking at the same time each day — we track your pattern, not a diagnosis.';
  }
  if (scores.overall === 'monitor') {
    return 'Overall: A few readings were slightly off today — that happens. Compare the next few days before worrying; one result is not enough to judge your health.';
  }
  return 'Overall: Several readings were outside the usual range today. That does not mean something is wrong — if this pattern continues over many check-ins, mention it at a routine GP appointment.';
}

/** Plain-English fallback when GLM is unavailable. */
export function buildPlainEnglishSummary(
  metrics: RawVoiceFeatures,
  scores?: VoiceMetricScores,
): string {
  const s = scores ?? scoreVoiceMetrics(metrics);

  const lines = [
    explainMetric('jitter', metrics, s),
    explainMetric('shimmer', metrics, s),
    explainMetric('hnr', metrics, s),
    explainMetric('mpt', metrics, s),
    overallTakeaway(s),
  ];

  return lines.join('\n\n');
}

const GLM_SYSTEM_PROMPT =
  'You explain sustained “ahhhh” voice check results to an older UK adult in very simple language. ' +
  'Write at most 5 short lines: one for pitch/jitter (%), volume/shimmer (%), clarity/HNR (dB), breath support/phonation time (seconds), then one overall line. ' +
  'Each line must give a different health-related reason — never repeat the same cause (e.g. do not blame tiredness on every line). ' +
  'Pitch = note steadiness; volume = loudness evenness; clarity = breathiness/noise; breath support = how long they held the sound. ' +
  'Use their exact numbers. Never diagnose. Under 100 words. Blank line between lines.';

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
