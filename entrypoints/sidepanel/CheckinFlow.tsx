import { useRef, useState } from 'react';
import {
  MIC_PERMISSION_COPY,
  openExtensionMicSettings,
  openMicPermissionTab,
} from '@/lib/micPermission';
import {
  CAMERA_PERMISSION_COPY,
  openCameraPermissionTab,
  openExtensionCameraSettings,
} from '@/lib/cameraPermission';
import EyeStation, { type EyeResult } from './stations/EyeStation';
import VoiceStation from './stations/VoiceStation';
import ReactionStation from './stations/ReactionStation';
import { scoreReaction, scoreVoice } from '@/lib/analysis/placeholder';
import { combineScore } from '@/lib/analysis/score';
import { dateKey, saveRecord } from '@/lib/storage';
import type {
  RawFeatures,
  StationKey,
  StationScore,
} from '@/lib/analysis/types';

// TEMP (issue #2): provisional eye score from heart rate until Person 4's scoring.ts
// lands. The "face" slot now runs the camera EyeStation (HR + blink).
function scoreEye(r: EyeResult): StationScore {
  if (!r.heartRateBpm) return { score: 0, note: 'No clean reading' };
  const inRange = r.heartRateBpm >= 60 && r.heartRateBpm <= 100;
  return { score: inRange ? 80 : 55, note: `HR ≈${r.heartRateBpm} bpm` };
}

const STEPS = [
  { key: 'face', label: 'Eye check' },
  { key: 'voice', label: 'Voice' },
  { key: 'reaction', label: 'Reaction' },
] as const;

export default function CheckinFlow({
  onFinished,
}: {
  onFinished: () => void;
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [stepError, setStepError] = useState<null | 'denied' | 'error'>(null);
  const [saving, setSaving] = useState(false);
  const stations = useRef<Partial<Record<StationKey, StationScore>>>({});
  const raw = useRef<RawFeatures>({});

  async function advance() {
    setStepError(null);
    if (stepIdx + 1 >= STEPS.length) {
      setSaving(true);
      const { baselineScore, feedback } = combineScore(stations.current);
      await saveRecord({
        date: dateKey(),
        baselineScore,
        stations: stations.current,
        raw: raw.current,
        feedback,
        createdAt: Date.now(),
      });
      onFinished();
    } else {
      setStepIdx((i) => i + 1);
      setAttempt((a) => a + 1);
    }
  }

  const step = STEPS[stepIdx].key;
  const key = `${step}-${attempt}`;

  return (
    <div className="space-y-4">
      <StepHeader idx={stepIdx} />

      {saving ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Saving your baseline…
        </p>
      ) : stepError ? (
        <StepErrorCard
          kind={stepError}
          step={step}
          onRetry={() => {
            setStepError(null);
            setAttempt((a) => a + 1);
          }}
          onSkip={advance}
        />
      ) : step === 'face' ? (
        <EyeStation
          key={key}
          onComplete={(r) => {
            stations.current.face = scoreEye(r);
            advance();
          }}
          onError={setStepError}
        />
      ) : step === 'voice' ? (
        <VoiceStation
          key={key}
          onComplete={(r) => {
            stations.current.voice = scoreVoice(r);
            raw.current.voice = r;
            advance();
          }}
          onError={setStepError}
        />
      ) : (
        <ReactionStation
          key={key}
          onComplete={(r) => {
            stations.current.reaction = scoreReaction(r);
            raw.current.reaction = r;
            advance();
          }}
        />
      )}
    </div>
  );
}

function StepErrorCard({
  kind,
  step,
  onRetry,
  onSkip,
}: {
  kind: 'denied' | 'error';
  step: StationKey;
  onRetry: () => void;
  onSkip: () => void;
}) {
  const isVoiceMic = kind === 'denied' && step === 'voice';
  const isCameraDenied = kind === 'denied' && step === 'face';

  return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
      <p className="text-sm text-amber-800">
        {isVoiceMic
          ? MIC_PERMISSION_COPY.sidePanelNote
          : isCameraDenied
            ? CAMERA_PERMISSION_COPY.sidePanelNote
            : kind === 'denied'
              ? 'Camera/microphone access was blocked for this step.'
              : 'This step couldn’t start.'}
      </p>
      {isVoiceMic ? (
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => void openMicPermissionTab().then(() => onRetry())}
            className="min-h-11 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Allow microphone (opens tab)
          </button>
          <button
            type="button"
            onClick={openExtensionMicSettings}
            className="min-h-11 rounded-lg border border-teal-300 bg-white py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
          >
            Open extension microphone settings
          </button>
        </div>
      ) : isCameraDenied ? (
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => void openCameraPermissionTab().then(() => onRetry())}
            className="min-h-11 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Allow camera (opens tab)
          </button>
          <button
            type="button"
            onClick={openExtensionCameraSettings}
            className="min-h-11 rounded-lg border border-teal-300 bg-white py-2 text-sm font-medium text-teal-800 hover:bg-teal-50"
          >
            Open extension camera settings
          </button>
        </div>
      ) : null}
      <div className="flex gap-2">
        <button
          onClick={onRetry}
          className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Try again
        </button>
        <button
          onClick={onSkip}
          className="flex-1 rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}

function StepHeader({ idx }: { idx: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' +
              (i === idx
                ? 'bg-teal-600 text-white'
                : i < idx
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400')
            }
          >
            <span>{i < idx ? '✓' : i + 1}</span>
            <span>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && <span className="text-slate-300">›</span>}
        </div>
      ))}
    </div>
  );
}
