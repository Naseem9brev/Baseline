import { reactionSubScores } from './analysis/placeholder';
import type { RawReactionFeatures, StationScore } from './analysis/types';
import { chatCompletion } from './zai';

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

const METRIC_MEANING = {
  tap: 'how quickly you tapped when the box turned green',
  choice: 'how fast and accurately you picked the correct arrow direction',
  memory: 'how many symbols you recalled in order on the grid',
  typing: 'how fast and accurately you typed the phrase',
} as const;

function explainTap(raw: RawReactionFeatures, subScore: number): string {
  const ms = Math.round(raw.reactionMs);
  if (subScore >= 75) {
    return `Tap reaction (${ms} ms): Quick responses — your alertness and motor speed looked sharp today. Compare to your own past check-ins, not other people.`;
  }
  if (subScore >= 55) {
    return `Tap reaction (${ms} ms): A typical speed — screen refresh and device lag can add tens of milliseconds, so day-to-day shifts are normal.`;
  }
  return `Tap reaction (${ms} ms): Slower taps today — tiredness, distraction, or a cold screen can slow this; one check is not enough to judge your health.`;
}

function explainChoice(raw: RawReactionFeatures, subScore: number): string {
  const ms = Math.round(raw.choiceReactionMs);
  const pct = Math.round(raw.choiceAccuracy * 100);
  if (pct < 80) {
    return `Arrow choice (${ms} ms, ${pct}% correct): A few wrong-side taps — accuracy matters here. Take an extra beat before tapping when unsure.`;
  }
  if (subScore >= 75) {
    return `Arrow choice (${ms} ms, ${pct}% correct): Fast, accurate decisions — your brain processed direction and responded well.`;
  }
  if (subScore >= 55) {
    return `Arrow choice (${ms} ms, ${pct}% correct): Solid decision speed with good accuracy — a reasonable result for a quick daily check.`;
  }
  return `Arrow choice (${ms} ms, ${pct}% correct): Took a little longer to pick the right side — fine for tracking trends over time.`;
}

function explainMemory(raw: RawReactionFeatures, subScore: number): string {
  const diff = DIFFICULTY_LABEL[raw.memoryDifficulty];
  if (subScore >= 80) {
    return `Memory sequence (${raw.memoryMaxLength} in a row, ${diff} grid): Strong recall at this difficulty — working memory looked on form today.`;
  }
  if (subScore >= 55) {
    return `Memory sequence (${raw.memoryMaxLength} in a row, ${diff} grid): Reasonable memory performance — a missed step or two is common.`;
  }
  return `Memory sequence (${raw.memoryMaxLength} in a row, ${diff} grid): Shorter sequence today — stress, rushing, or an off day can shorten recall; watch your trend, not one score.`;
}

function explainTyping(raw: RawReactionFeatures, subScore: number): string {
  const pct = Math.round(raw.accuracy * 100);
  if (pct < 90) {
    return `Typing (${raw.wpm} wpm, ${pct}% accurate): Some character mismatches — double-check each letter when accuracy matters more than speed.`;
  }
  if (subScore >= 75) {
    return `Typing (${raw.wpm} wpm, ${pct}% accurate): Fast, accurate typing — finger dexterity and focus looked good.`;
  }
  if (subScore >= 55) {
    return `Typing (${raw.wpm} wpm, ${pct}% accurate): Comfortable typing pace — fine for a daily baseline snapshot.`;
  }
  return `Typing (${raw.wpm} wpm, ${pct}% accurate): Slower typing today — that is normal variation unless it keeps dropping over many check-ins.`;
}

function overallTakeaway(score: StationScore): string {
  if (score.score >= 75) {
    return `Overall (${score.score}/100): Reaction and cognition looked steady today. These mini-tests track your personal pattern — not a diagnosis.`;
  }
  if (score.score >= 55) {
    return `Overall (${score.score}/100): Mixed but reasonable results — compare the next few days before reading much into one check-in.`;
  }
  return `Overall (${score.score}/100): Several scores were lower today — sleep, stress, or rushing can affect all four tests. Mention a persistent downward trend at a routine GP visit if you are concerned.`;
}

/** Plain-English fallback when GLM is unavailable. */
export function buildPlainEnglishSummary(
  raw: RawReactionFeatures,
  score: StationScore,
): string {
  const sub = reactionSubScores(raw);
  const lines = [
    explainTap(raw, sub.tap),
    explainChoice(raw, Math.round((sub.choice + sub.choiceAcc) / 2)),
    explainMemory(raw, sub.memory),
    explainTyping(raw, Math.round((sub.wpm + sub.typingAcc) / 2)),
    overallTakeaway(score),
  ];
  return lines.join('\n\n');
}

const GLM_SYSTEM_PROMPT =
  'You explain daily reaction-and-cognition check results to an older UK adult in very simple language. ' +
  'Write at most 5 short lines: one for tap reaction time (ms), one for arrow choice (ms and accuracy %), ' +
  'one for memory sequence (length and difficulty), one for typing (wpm and accuracy %), then one overall line. ' +
  'Each line must give a different everyday reason — never repeat the same cause on every line. ' +
  'Tap = simple reaction speed; arrows = decision speed + accuracy; memory = working memory; typing = dexterity + focus. ' +
  'Use their exact numbers. Never diagnose. Under 100 words. Blank line between lines.';

/** GLM 5.1 summary when a Z.AI key is saved; null if unavailable or request fails. */
export async function fetchGlmReactionSummary(
  raw: RawReactionFeatures,
  score: StationScore,
  apiKey?: string,
): Promise<string | null> {
  const sub = reactionSubScores(raw);

  return chatCompletion(
    [
      { role: 'system', content: GLM_SYSTEM_PROMPT },
      {
        role: 'user',
        content: JSON.stringify({
          task: 'reaction station (tap, arrows, memory, typing)',
          metrics: raw,
          subScores: {
            tap: sub.tap,
            arrowChoice: Math.round((sub.choice + sub.choiceAcc) / 2),
            memory: sub.memory,
            typing: Math.round((sub.wpm + sub.typingAcc) / 2),
            combined: score.score,
          },
          meaningGuide: METRIC_MEANING,
          note: score.note,
        }),
      },
    ],
    { apiKey },
  );
}

/** Instant fallback plus optional GLM upgrade. */
export async function interpretReactionResult(
  raw: RawReactionFeatures,
  score: StationScore,
): Promise<{ summary: string; usedAi: boolean }> {
  const fallback = buildPlainEnglishSummary(raw, score);
  const ai = await fetchGlmReactionSummary(raw, score);
  if (ai) return { summary: ai, usedAi: true };
  return { summary: fallback, usedAi: false };
}

export { METRIC_MEANING };
