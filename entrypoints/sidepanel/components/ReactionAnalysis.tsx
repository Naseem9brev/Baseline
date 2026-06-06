import { reactionSubScores } from '@/lib/analysis/placeholder';
import type { RawReactionFeatures, StationScore } from '@/lib/analysis/types';

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

export default function ReactionAnalysis({
  raw,
  score,
  onContinue,
}: {
  raw: RawReactionFeatures;
  score: StationScore;
  onContinue: () => void;
}) {
  const sub = reactionSubScores(raw);
  const choicePct = Math.round(raw.choiceAccuracy * 100);
  const typingPct = Math.round(raw.accuracy * 100);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Reaction — your results</h2>
        <div className="mt-3 flex items-center gap-4">
          <ScoreRing score={score.score} />
          <div className="flex-1 space-y-1">
            <p className="text-sm text-slate-600">{score.note}</p>
            <p className="text-[11px] text-slate-400">
              Combined score from all four mini-tests below.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <MetricCard
          label="Tap reaction"
          score={sub.tap}
          detail={`${Math.round(raw.reactionMs)} ms average across 3 taps · 500 ms = midpoint`}
          insight={tapInsight(raw.reactionMs)}
        />
        <MetricCard
          label="Arrow choice"
          score={Math.round((sub.choice + sub.choiceAcc) / 2)}
          detail={`${Math.round(raw.choiceReactionMs)} ms · ${choicePct}% correct`}
          insight={choiceInsight(raw.choiceReactionMs, choicePct)}
        />
        <MetricCard
          label="Memory sequence"
          score={sub.memory}
          detail={`${raw.memoryMaxLength} in a row · ${DIFFICULTY_LABEL[raw.memoryDifficulty]}`}
          insight={memoryInsight(raw.memoryMaxLength, raw.memoryDifficulty)}
        />
        <MetricCard
          label="Typing"
          score={Math.round((sub.wpm + sub.typingAcc) / 2)}
          detail={`${raw.wpm} wpm · ${typingPct}% accurate`}
          insight={typingInsight(raw.wpm, typingPct)}
        />
      </div>

      <button
        onClick={onContinue}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
      >
        Save check-in
      </button>
      <p className="text-center text-[10px] text-slate-400">
        Provisional scores for trend tracking — not medical advice.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  score,
  detail,
  insight,
}: {
  label: string;
  score: number;
  detail: string;
  insight: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <span className="text-xs font-bold tabular-nums text-slate-600">{score}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor: scoreColor(score),
          }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{insight}</p>
    </div>
  );
}

function tapInsight(_ms: number): string {
  return 'Time from green to tap. Device speed and screen refresh can shift this — compare to your own past check-ins.';
}

function choiceInsight(ms: number, pct: number): string {
  if (pct < 80) return 'A few wrong-side taps — accuracy matters here.';
  if (ms < 300) return 'Fast and accurate arrow responses.';
  if (ms < 500) return 'Solid decision speed with good accuracy.';
  return 'Took a little longer to pick the right side.';
}

function memoryInsight(
  length: number,
  difficulty: RawReactionFeatures['memoryDifficulty'],
): string {
  const target = { easy: 6, medium: 5, hard: 4 }[difficulty];
  if (length >= target) return 'Strong sequence recall at this difficulty.';
  if (length >= target - 2) return 'Reasonable memory performance.';
  return 'Shorter sequence today — normal day-to-day variation.';
}

function typingInsight(wpm: number, pct: number): string {
  if (pct < 90) return 'Some character mismatches in the phrase.';
  if (wpm >= 35) return 'Fast, accurate typing.';
  if (wpm >= 20) return 'Comfortable typing pace.';
  return 'Slower typing — fine for a daily baseline.';
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div
      className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-lg font-bold text-white"
      style={{ backgroundColor: scoreColor(score) }}
    >
      {score}
    </div>
  );
}

function scoreColor(score: number): string {
  const hue = Math.round((score / 100) * 130);
  return `hsl(${hue}, 65%, 45%)`;
}
