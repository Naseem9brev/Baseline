import { useEffect, useRef, useState } from 'react';
import type { RawReactionFeatures } from '@/lib/analysis/types';

const TAP_TRIALS = 3;
const CHOICE_TRIALS = 5;
const PHRASE = 'stay healthy every day';

const SUB_STEPS = [
  { key: 'reaction', label: 'Tap' },
  { key: 'choice', label: 'Arrows' },
  { key: 'typing', label: 'Type' },
] as const;

type Sub = (typeof SUB_STEPS)[number]['key'];
type BoxState = 'waiting' | 'ready' | 'tooEarly';
type Direction = 'left' | 'right';
type ChoiceState = 'waiting' | 'ready' | 'tooEarly' | 'wrong';

export default function ReactionStation({
  onComplete,
}: {
  onComplete: (raw: RawReactionFeatures) => void;
}) {
  const [sub, setSub] = useState<Sub>('reaction');
  const [reactionMs, setReactionMs] = useState(0);
  const [choiceReactionMs, setChoiceReactionMs] = useState(0);
  const [choiceAccuracy, setChoiceAccuracy] = useState(0);

  function handleReactionDone(avgMs: number) {
    setReactionMs(avgMs);
    setSub('choice');
  }

  function handleChoiceDone(avgMs: number, accuracy: number) {
    setChoiceReactionMs(avgMs);
    setChoiceAccuracy(accuracy);
    setSub('typing');
  }

  function handleTypingDone(wpm: number, accuracy: number) {
    onComplete({ reactionMs, choiceReactionMs, choiceAccuracy, wpm, accuracy });
  }

  const subIdx = SUB_STEPS.findIndex((s) => s.key === sub);

  return (
    <div className="space-y-3">
      <SubProgress idx={subIdx} />
      {sub === 'reaction' ? (
        <ReactionTest onDone={handleReactionDone} />
      ) : sub === 'choice' ? (
        <ChoiceReactionTest onDone={handleChoiceDone} />
      ) : (
        <TypingTest onDone={handleTypingDone} />
      )}
    </div>
  );
}

function SubProgress({ idx }: { idx: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {SUB_STEPS.map((s, i) => (
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
          {i < SUB_STEPS.length - 1 && <span className="text-slate-300">›</span>}
        </div>
      ))}
    </div>
  );
}

function ReactionTest({ onDone }: { onDone: (avgMs: number) => void }) {
  const [state, setState] = useState<BoxState>('waiting');
  const [trial, setTrial] = useState(0);
  const times = useRef<number[]>([]);
  const readyAt = useRef(0);
  const timer = useRef<number>(0);

  useEffect(() => {
    setState('waiting');
    const delay = 1000 + Math.random() * 2500;
    timer.current = window.setTimeout(() => {
      readyAt.current = performance.now();
      setState('ready');
    }, delay);
    return () => clearTimeout(timer.current);
  }, [trial]);

  function handleClick() {
    if (state === 'ready') {
      times.current.push(performance.now() - readyAt.current);
      if (trial + 1 >= TAP_TRIALS) {
        onDone(times.current.reduce((a, b) => a + b, 0) / times.current.length);
      } else {
        setTrial((t) => t + 1);
      }
    } else if (state === 'waiting') {
      clearTimeout(timer.current);
      setState('tooEarly');
      window.setTimeout(restart, 800);
    }
  }

  function restart() {
    setState('waiting');
    const delay = 1000 + Math.random() * 2500;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      readyAt.current = performance.now();
      setState('ready');
    }, delay);
  }

  const bg =
    state === 'ready'
      ? 'bg-emerald-500'
      : state === 'tooEarly'
        ? 'bg-rose-500'
        : 'bg-slate-700';
  const label =
    state === 'ready'
      ? 'TAP!'
      : state === 'tooEarly'
        ? 'Too early — wait for green'
        : 'Wait for green…';

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-slate-600">
        Reaction test · trial {Math.min(trial + 1, TAP_TRIALS)} of {TAP_TRIALS}
      </p>
      <button
        onClick={handleClick}
        className={`grid h-48 w-full place-items-center rounded-xl text-xl font-bold text-white transition-colors ${bg}`}
      >
        {label}
      </button>
      <p className="text-center text-[11px] text-slate-400">
        Tap the box the instant it turns green.
      </p>
    </div>
  );
}

function ChoiceReactionTest({
  onDone,
}: {
  onDone: (avgMs: number, accuracy: number) => void;
}) {
  const [state, setState] = useState<ChoiceState>('waiting');
  const [trial, setTrial] = useState(0);
  const [direction, setDirection] = useState<Direction>('left');
  const times = useRef<number[]>([]);
  const correct = useRef(0);
  const shownAt = useRef(0);
  const timer = useRef<number>(0);

  useEffect(() => {
    scheduleTrial();
    return () => clearTimeout(timer.current);
  }, [trial]);

  function scheduleTrial() {
    setState('waiting');
    setDirection(Math.random() < 0.5 ? 'left' : 'right');
    const delay = 800 + Math.random() * 2000;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      shownAt.current = performance.now();
      setState('ready');
    }, delay);
  }

  function finish() {
    const avgMs =
      times.current.length > 0
        ? times.current.reduce((a, b) => a + b, 0) / times.current.length
        : 700;
    onDone(Math.round(avgMs), correct.current / CHOICE_TRIALS);
  }

  function advanceTrial() {
    if (trial + 1 >= CHOICE_TRIALS) {
      finish();
    } else {
      setTrial((t) => t + 1);
    }
  }

  function handleChoice(side: Direction) {
    if (state === 'ready') {
      if (side === direction) {
        times.current.push(performance.now() - shownAt.current);
        correct.current += 1;
        advanceTrial();
      } else {
        setState('wrong');
        window.setTimeout(advanceTrial, 600);
      }
    } else if (state === 'waiting') {
      clearTimeout(timer.current);
      setState('tooEarly');
      window.setTimeout(scheduleTrial, 800);
    }
  }

  const prompt =
    state === 'ready'
      ? direction === 'left'
        ? '←'
        : '→'
      : state === 'tooEarly'
        ? 'Too early'
        : state === 'wrong'
          ? 'Wrong side'
          : '…';

  const promptBg =
    state === 'ready'
      ? 'bg-slate-800 text-white'
      : state === 'tooEarly' || state === 'wrong'
        ? 'bg-rose-500 text-white'
        : 'bg-slate-200 text-slate-500';

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-slate-600">
        Arrow test · trial {Math.min(trial + 1, CHOICE_TRIALS)} of {CHOICE_TRIALS}
      </p>
      <div
        className={`grid h-32 w-full place-items-center rounded-xl text-5xl font-bold transition-colors ${promptBg}`}
        aria-live="polite"
      >
        {state === 'waiting' ? 'Wait for arrow…' : prompt}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleChoice('left')}
          className="rounded-xl bg-slate-700 py-4 text-lg font-bold text-white hover:bg-slate-800"
        >
          ← Left
        </button>
        <button
          onClick={() => handleChoice('right')}
          className="rounded-xl bg-slate-700 py-4 text-lg font-bold text-white hover:bg-slate-800"
        >
          Right →
        </button>
      </div>
      <p className="text-center text-[11px] text-slate-400">
        Tap the matching side as soon as the arrow appears.
      </p>
    </div>
  );
}

function TypingTest({
  onDone,
}: {
  onDone: (wpm: number, accuracy: number) => void;
}) {
  const [value, setValue] = useState('');
  const startedAt = useRef(0);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!startedAt.current) startedAt.current = performance.now();
    setValue(e.target.value);
  }

  function submit() {
    const minutes = (performance.now() - startedAt.current) / 60000;
    const wpm = minutes > 0 ? value.length / 5 / minutes : 0;
    let correct = 0;
    for (let i = 0; i < PHRASE.length; i++) {
      if (value[i] === PHRASE[i]) correct++;
    }
    const accuracy = correct / PHRASE.length;
    onDone(Math.round(wpm), accuracy);
  }

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-slate-600">Type this phrase:</p>
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-center text-lg font-medium tracking-wide text-slate-700 shadow-sm">
        {PHRASE}
      </div>
      <input
        autoFocus
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Start typing…"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      />
      <button
        onClick={submit}
        disabled={value.length === 0}
        className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
      >
        Done
      </button>
    </div>
  );
}
