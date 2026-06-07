import { useEffect, useState } from 'react';
import { reactionSubScores } from '@/lib/analysis/placeholder';
import {
  buildPlainEnglishSessionSummary,
  fetchAiSessionSummary,
} from '@/lib/sessionInterpretation';
import { llmProviderLabel } from '@/lib/llm';
import type {
  RawFeatures,
  RawReactionFeatures,
  StationKey,
  StationScore,
} from '@/lib/analysis/types';

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

export default function ReactionAnalysis({
  raw,
  score,
  stations,
  rawFeatures,
  onContinue,
}: {
  raw: RawReactionFeatures;
  score: StationScore;
  stations: Partial<Record<StationKey, StationScore>>;
  rawFeatures: RawFeatures;
  onContinue: (feedback: string) => void;
}) {
  const sub = reactionSubScores(raw);
  const choicePct = Math.round(raw.choiceAccuracy * 100);
  const typingPct = Math.round(raw.accuracy * 100);

  const [sessionSummary, setSessionSummary] = useState(() =>
    buildPlainEnglishSessionSummary(stations, rawFeatures),
  );
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [usedAi, setUsedAi] = useState(false);
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReview() {
      setAiEnhancing(true);
      try {
        const result = await fetchAiSessionSummary(stations, rawFeatures);
        if (cancelled) return;
        setSessionSummary(result.summary);
        setUsedAi(result.usedAi);
        if (result.provider) setAiProvider(llmProviderLabel(result.provider));
      } finally {
        if (!cancelled) setAiEnhancing(false);
      }
    }

    void loadReview();
    return () => {
      cancelled = true;
    };
  }, [stations, rawFeatures]);

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="serif-h" style={{ fontSize: 16 }}>Reaction — your results</h2>
        <div className="mt-3 flex items-center gap-4">
          <ScoreRing score={score.score} />
          <div className="flex-1 space-y-1">
            <p className="text-sm text-[var(--ink-2)]">{score.note}</p>
            <p className="text-[11px] text-[var(--ink-3)]">
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

      <div className="card flat wash">
        <p className="eyebrow">Today&apos;s check-in review</p>
        <div className="mt-2 space-y-3">
          {sessionSummary.split(/\n\n+/).map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-[var(--ink)]">
              {paragraph}
            </p>
          ))}
        </div>
        {aiEnhancing ? (
          <p className="mt-3 text-xs text-[var(--ink-2)]">Writing your review…</p>
        ) : usedAi ? (
          <p className="mt-3 text-[10px] text-[var(--ink-3)]">
            Review by {aiProvider ?? 'AI'} · only your scores were sent
          </p>
        ) : (
          <p className="mt-3 text-[10px] text-[var(--ink-3)]">
            Add a Z.AI or Gemini API key in Settings for an AI-written review (optional)
          </p>
        )}
      </div>

      <button
        onClick={() => onContinue(sessionSummary)}
        disabled={aiEnhancing}
        className="btn btn-primary"
      >
        Save check-in
      </button>
      <p className="muted text-center" style={{ fontSize: 10 }}>
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
    <div className="card flat">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--ink)]">{label}</span>
        <span className="text-xs font-bold tabular-nums text-[var(--ink-2)]">{score}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--paper-sunk)]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor: scoreColor(score),
          }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--ink-2)]">{detail}</p>
      <p className="mt-0.5 text-[11px] text-[var(--ink-3)]">{insight}</p>
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
      className="tabnum grid h-16 w-16 shrink-0 place-items-center rounded-full text-lg font-bold"
      style={{ backgroundColor: scoreColor(score), color: '#FBF3E6' }}
    >
      {score}
    </div>
  );
}

function scoreColor(score: number): string {
  // Herb status tokens (sage / amber / jujube) — no rainbow HSL ramp.
  if (score >= 70) return 'var(--sage)';
  if (score >= 45) return 'var(--saffron)';
  return 'var(--jujube)';
}
