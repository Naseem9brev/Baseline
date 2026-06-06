import { useEffect, useState } from 'react';
import { reactionSubScores } from '@/lib/analysis/placeholder';
import type { RawReactionFeatures, StationScore } from '@/lib/analysis/types';
import {
  buildPlainEnglishSummary,
  fetchGlmReactionSummary,
} from '@/lib/reactionInterpretation';
import { getZaiApiKey } from '@/lib/settings';

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

  const [summary, setSummary] = useState(() => buildPlainEnglishSummary(raw, score));
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [usedAi, setUsedAi] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setUsedAi(false);
      setSummary(buildPlainEnglishSummary(raw, score));

      const hasZaiKey = !!(await getZaiApiKey());
      if (!hasZaiKey || cancelled) return;

      setAiEnhancing(true);
      try {
        const glmSummary = await fetchGlmReactionSummary(raw, score);
        if (!cancelled && glmSummary) {
          setSummary(glmSummary);
          setUsedAi(true);
        }
      } finally {
        if (!cancelled) setAiEnhancing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [raw, score]);

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
        />
        <MetricCard
          label="Arrow choice"
          score={Math.round((sub.choice + sub.choiceAcc) / 2)}
          detail={`${Math.round(raw.choiceReactionMs)} ms · ${choicePct}% correct`}
        />
        <MetricCard
          label="Memory sequence"
          score={sub.memory}
          detail={`${raw.memoryMaxLength} in a row · ${DIFFICULTY_LABEL[raw.memoryDifficulty]}`}
        />
        <MetricCard
          label="Typing"
          score={Math.round((sub.wpm + sub.typingAcc) / 2)}
          detail={`${raw.wpm} wpm · ${typingPct}% accurate`}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          What your results mean
        </p>
        <div className="mt-2 space-y-3">
          {summary.split(/\n\n+/).map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-slate-700">
              {paragraph}
            </p>
          ))}
        </div>
        {aiEnhancing ? (
          <p className="mt-3 text-xs text-slate-500">Personalising summary with GLM…</p>
        ) : usedAi ? (
          <p className="mt-3 text-[10px] text-slate-400">
            Summary by GLM 5.1 · only your numbers were sent
          </p>
        ) : (
          <p className="mt-3 text-[10px] text-slate-400">
            Add a Z.AI API key in Settings for an AI-written summary (optional)
          </p>
        )}
      </div>

      <button
        onClick={onContinue}
        disabled={aiEnhancing}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
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
}: {
  label: string;
  score: number;
  detail: string;
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
    </div>
  );
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
