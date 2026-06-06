import { useEffect, useRef, useState } from 'react';
import type { RawReactionFeatures } from '@/lib/analysis/types';

const TRIALS = 3;
const PHRASE = 'stay healthy every day';

type Sub = 'reaction' | 'typing';
type BoxState = 'waiting' | 'ready' | 'tooEarly';

export default function ReactionStation({
  onComplete,
}: {
  onComplete: (raw: RawReactionFeatures) => void;
}) {
  const [sub, setSub] = useState<Sub>('reaction');
  const [reactionMs, setReactionMs] = useState(0);

  function handleReactionDone(avgMs: number) {
    setReactionMs(avgMs);
    setSub('typing');
  }

  function handleTypingDone(wpm: number, accuracy: number) {
    onComplete({ reactionMs, wpm, accuracy });
  }

  return sub === 'reaction' ? (
    <ReactionTest onDone={handleReactionDone} />
  ) : (
    <TypingTest onDone={handleTypingDone} />
  );
}

function ReactionTest({ onDone }: { onDone: (avgMs: number) => void }) {
  const [state, setState] = useState<BoxState>('waiting');
  const [trial, setTrial] = useState(0);
  const times = useRef<number[]>([]);
  const readyAt = useRef(0);
  const timer = useRef<number>(0);

  useEffect(() => {
    // schedule the green flash for the current trial
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
      if (trial + 1 >= TRIALS) {
        onDone(times.current.reduce((a, b) => a + b, 0) / times.current.length);
      } else {
        setTrial((t) => t + 1);
      }
    } else if (state === 'waiting') {
      // clicked too early — flash red, then restart this trial
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
        Reaction test · trial {Math.min(trial + 1, TRIALS)} of {TRIALS}
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
