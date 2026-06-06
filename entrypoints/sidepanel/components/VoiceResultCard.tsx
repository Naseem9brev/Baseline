import type { RawVoiceFeatures } from '@/lib/analysis/types';
import {
  scoreVoiceMetrics,
  statusBadgeClass,
  VOICE_STATUS_LABEL,
  type VoiceMetricStatus,
} from '@/lib/voiceScoring';

export default function VoiceResultCard({
  metrics,
  summary,
  aiEnhancing,
  usedAi,
  aiProvider,
  onContinue,
}: {
  metrics: RawVoiceFeatures;
  summary: string;
  aiEnhancing: boolean;
  usedAi: boolean;
  aiProvider?: string | null;
  onContinue: () => void;
}) {
  const scores = scoreVoiceMetrics(metrics);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--line)] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wide text-[var(--ink-3)]">Voice results</p>
          <span
            className={
              'rounded-full px-2.5 py-0.5 text-xs font-semibold ' +
              statusBadgeClass(scores.overall)
            }
          >
            {VOICE_STATUS_LABEL[scores.overall]}
          </span>
        </div>

        <p className="mt-2 text-sm text-[var(--ink-2)]">
          Sustained “ahhhh” · analysed on this device (praatfan)
        </p>

        <dl className="mt-4 space-y-3">
          <MetricRow
            label="Jitter"
            value={`${metrics.jitter}%`}
            detail="How steady your pitch was — lower means less wobble"
            status={scores.jitter}
          />
          <MetricRow
            label="Shimmer"
            value={`${metrics.shimmer}%`}
            detail="How steady your volume was — lower means more even"
            status={scores.shimmer}
          />
          <MetricRow
            label="HNR (clarity)"
            value={`${metrics.hnr} dB`}
            detail="How clear the vowel sounded vs breathy or noisy"
            status={scores.hnr}
          />
          <MetricRow
            label="Phonation time"
            value={`${metrics.mptSec}s`}
            detail="How long you held “ahhhh”"
            status={scores.mpt}
          />
        </dl>
      </div>

      <div className="rounded-xl border border-[var(--line)] bg-[var(--paper-2)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-3)]">
          What your results mean
        </p>
        <div className="mt-2 space-y-3">
          {summary.split(/\n\n+/).map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-[var(--ink)]">
              {paragraph}
            </p>
          ))}
        </div>
        {aiEnhancing ? (
          <p className="mt-3 text-xs text-[var(--ink-2)]">Personalising summary…</p>
        ) : usedAi ? (
          <p className="mt-3 text-[10px] text-[var(--ink-3)]">
            Summary by {aiProvider ?? 'AI'} · only your numbers were sent, never audio
          </p>
        ) : (
          <p className="mt-3 text-[10px] text-[var(--ink-3)]">
            Add a Z.AI or Gemini API key in Settings for an AI-written summary (optional)
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={aiEnhancing}
        className="min-h-12 w-full rounded-xl bg-[var(--ginseng)] text-sm font-semibold text-white hover:bg-[var(--ginseng-deep)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Continue
      </button>

      <p className="text-center text-[10px] leading-relaxed text-[var(--ink-3)]">
        Not a diagnostic tool · compare trends over your daily check-ins
      </p>
    </div>
  );
}

function MetricRow({
  label,
  value,
  detail,
  status,
}: {
  label: string;
  value: string;
  detail: string;
  status: VoiceMetricStatus;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <dt className="text-sm font-medium text-[var(--ink)]">{label}</dt>
        <dd className="text-xs text-[var(--ink-2)]">{detail}</dd>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold tabular-nums text-[#34302B]">{value}</div>
        <span
          className={
            'mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ' +
            statusBadgeClass(status)
          }
        >
          {VOICE_STATUS_LABEL[status]}
        </span>
      </div>
    </div>
  );
}
