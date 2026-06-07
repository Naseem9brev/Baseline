import { Fragment, useRef, useState } from 'react';
import { Ic } from './components/icons';
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
import ReactionAnalysis from './components/ReactionAnalysis';
import { scoreReaction, scoreVoice } from '@/lib/analysis/placeholder';
import { combineScore } from '@/lib/analysis/score';
import { dateKey, saveRecord } from '@/lib/storage';
import type {
  RawFeatures,
  RawReactionFeatures,
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
  const [reactionReview, setReactionReview] = useState<{
    raw: RawReactionFeatures;
    score: StationScore;
  } | null>(null);
  const stations = useRef<Partial<Record<StationKey, StationScore>>>({});
  const raw = useRef<RawFeatures>({});

  async function advance(feedback?: string) {
    setStepError(null);
    if (stepIdx + 1 >= STEPS.length) {
      setReactionReview(null);
      setSaving(true);
      const { baselineScore, feedback: defaultFeedback } = combineScore(stations.current);
      await saveRecord({
        date: dateKey(),
        baselineScore,
        stations: stations.current,
        raw: raw.current,
        feedback: feedback ?? defaultFeedback,
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
      <StepHeader idx={reactionReview ? STEPS.length : stepIdx} />

      {reactionReview ? (
        <ReactionAnalysis
          raw={reactionReview.raw}
          score={reactionReview.score}
          stations={stations.current}
          rawFeatures={raw.current}
          onContinue={advance}
        />
      ) : saving ? (
        <p className="muted py-8 text-center" style={{ fontSize: 14 }}>
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
            raw.current.face = {
              blinkRate: r.blinkRate,
              eyeOpenness: 0,
              irisStability: 0,
              framesDetected: 0,
              heartRateBpm: r.heartRateBpm,
              hrConfidence: r.hrConfidence,
            };
            advance();
          }}
          onError={setStepError}
          onSkip={advance}
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
            const scored = scoreReaction(r);
            stations.current.reaction = scored;
            raw.current.reaction = r;
            setReactionReview({ raw: r, score: scored });
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
    <div className="card tint space-y-3 text-center">
      <p style={{ fontSize: 14, color: 'var(--ink-2)' }}>
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
            className="btn btn-primary"
          >
            Allow microphone (opens tab)
          </button>
          <button type="button" onClick={openExtensionMicSettings} className="btn btn-ghost">
            Open extension microphone settings
          </button>
        </div>
      ) : isCameraDenied ? (
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => void openCameraPermissionTab().then(() => onRetry())}
            className="btn btn-primary"
          >
            Allow camera (opens tab)
          </button>
          <button type="button" onClick={openExtensionCameraSettings} className="btn btn-ghost">
            Open extension camera settings
          </button>
        </div>
      ) : null}
      <div className="flex gap-2">
        <button onClick={onRetry} className="btn btn-primary" style={{ flex: 1 }}>
          Try again
        </button>
        <button onClick={onSkip} className="btn btn-quiet" style={{ flex: 1 }}>
          Skip this step
        </button>
      </div>
    </div>
  );
}

function StepHeader({ idx }: { idx: number }) {
  return (
    <div className="steps" style={{ justifyContent: 'center' }}>
      {STEPS.map((s, i) => {
        const state = i < idx ? 'done' : i === idx ? 'on' : 'todo';
        return (
          <Fragment key={s.key}>
            <div className={`step-pill ${state}`}>
              <span className="step-num">
                {i < idx ? <Ic.check width={11} height={11} /> : i + 1}
              </span>
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <span style={{ color: 'var(--ink-4)' }}>›</span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
