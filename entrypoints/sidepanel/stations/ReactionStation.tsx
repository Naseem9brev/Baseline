import { useCallback, useEffect, useRef, useState } from 'react';
import type { MemoryDifficulty, RawReactionFeatures } from '@/lib/analysis/types';

const TAP_TRIALS = 3;
const CHOICE_TRIALS = 5;
const MAX_MEMORY_LENGTH = 15;
const FLASH_MS = 450;
const GAP_MS = 180;

const SUB_STEPS = [
  { key: 'reaction', label: 'Tap' },
  { key: 'choice', label: 'Arrows' },
  { key: 'memory', label: 'Memory' },
] as const;

type Sub = (typeof SUB_STEPS)[number]['key'];
type BoxState = 'waiting' | 'ready' | 'tooEarly';
type Direction = 'left' | 'right';
type ChoiceState = 'waiting' | 'ready' | 'tooEarly' | 'wrong';
type MemoryPhase = 'pick' | 'watch' | 'input' | 'success' | 'gameover';

const DIFFICULTY_CONFIG: Record<
  MemoryDifficulty,
  { pads: number; cols: number; label: string; hint: string }
> = {
  easy: { pads: 4, cols: 2, label: 'Easy', hint: '4 squares' },
  medium: { pads: 6, cols: 3, label: 'Medium', hint: '6 squares' },
  hard: { pads: 9, cols: 3, label: 'Hard', hint: '9 squares' },
};

const PAD_FREQS = [262, 294, 330, 392, 440, 494, 523, 587, 659];
const PAD_COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-amber-400',
  'bg-rose-500',
  'bg-violet-500',
  'bg-orange-400',
  'bg-teal-500',
  'bg-pink-500',
  'bg-lime-500',
];
const PAD_LIT = [
  'bg-emerald-300',
  'bg-sky-300',
  'bg-amber-200',
  'bg-rose-300',
  'bg-violet-300',
  'bg-orange-200',
  'bg-teal-300',
  'bg-pink-300',
  'bg-lime-300',
];

export default function ReactionStation({
  onComplete,
}: {
  onComplete: (raw: RawReactionFeatures) => void;
}) {
  const [sub, setSub] = useState<Sub>('reaction');
  const [reactionMs, setReactionMs] = useState(0);
  const [choiceReactionMs, setChoiceReactionMs] = useState(0);
  const [choiceAccuracy, setChoiceAccuracy] = useState(0);
  const [memoryMaxLength, setMemoryMaxLength] = useState(0);
  const [memoryDifficulty, setMemoryDifficulty] = useState<MemoryDifficulty>('easy');

  function handleReactionDone(avgMs: number) {
    setReactionMs(avgMs);
    setSub('choice');
  }

  function handleChoiceDone(avgMs: number, accuracy: number) {
    setChoiceReactionMs(avgMs);
    setChoiceAccuracy(accuracy);
    setSub('memory');
  }

  function handleMemoryDone(maxLength: number, difficulty: MemoryDifficulty) {
    setMemoryMaxLength(maxLength);
    setMemoryDifficulty(difficulty);
    onComplete({
      reactionMs,
      choiceReactionMs,
      choiceAccuracy,
      memoryMaxLength,
      memoryDifficulty,
      wpm: 0,
      accuracy: 0,
    });
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
        <MemorySequenceTest onDone={handleMemoryDone} />
      )}
    </div>
  );
}

function SubProgress({ idx }: { idx: number }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {SUB_STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1.5">
          <div
            className={
              'flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ' +
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
          {i < SUB_STEPS.length - 1 && (
            <span className="text-slate-300 text-xs">›</span>
          )}
        </div>
      ))}
    </div>
  );
}

function useTonePlayer() {
  const ctx = useRef<AudioContext | null>(null);

  const playTone = useCallback((freq: number, duration = 0.32) => {
    if (!ctx.current) ctx.current = new AudioContext();
    const ac = ctx.current;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.12, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + duration);
  }, []);

  return { playTone };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function ReactionTest({ onDone }: { onDone: (avgMs: number) => void }) {
  const [state, setState] = useState<BoxState>('waiting');
  const [trial, setTrial] = useState(0);
  const times = useRef<number[]>([]);
  const readyAt = useRef(0);
  const armed = useRef(false);
  const timer = useRef<number>(0);

  function armAfterPaint() {
    armed.current = false;
    setState('ready');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        readyAt.current = performance.now();
        armed.current = true;
      });
    });
  }

  useEffect(() => {
    armed.current = false;
    setState('waiting');
    const delay = 1000 + Math.random() * 2500;
    timer.current = window.setTimeout(armAfterPaint, delay);
    return () => clearTimeout(timer.current);
  }, [trial]);

  function handleClick() {
    if (state === 'ready' && armed.current) {
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
    armed.current = false;
    setState('waiting');
    const delay = 1000 + Math.random() * 2500;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(armAfterPaint, delay);
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
        times.current.push(performance.now() - shownAt.current);
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

function MemorySequenceTest({
  onDone,
}: {
  onDone: (maxLength: number, difficulty: MemoryDifficulty) => void;
}) {
  const { playTone } = useTonePlayer();
  const [difficulty, setDifficulty] = useState<MemoryDifficulty | null>(null);
  const [phase, setPhase] = useState<MemoryPhase>('pick');
  const [litPad, setLitPad] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [resultLength, setResultLength] = useState(0);
  const sequence = useRef<number[]>([]);
  const inputIdx = useRef(0);
  const playing = useRef(false);
  const finished = useRef(false);

  const config = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  const flashPad = useCallback(
    async (pad: number) => {
      setLitPad(pad);
      playTone(PAD_FREQS[pad]);
      await wait(FLASH_MS);
      setLitPad(null);
      await wait(GAP_MS);
    },
    [playTone],
  );

  const playSequence = useCallback(async () => {
    if (playing.current) return;
    playing.current = true;
    setPhase('watch');
    for (const pad of sequence.current) {
      await flashPad(pad);
    }
    playing.current = false;
    inputIdx.current = 0;
    setPhase('input');
  }, [flashPad]);

  const endGame = useCallback(
    (maxLength: number) => {
      if (finished.current || !difficulty) return;
      finished.current = true;
      setResultLength(maxLength);
      setPhase('gameover');
      window.setTimeout(() => onDone(maxLength, difficulty), 1400);
    },
    [difficulty, onDone],
  );

  const startGame = useCallback(
    (d: MemoryDifficulty) => {
      finished.current = false;
      playing.current = false;
      sequence.current = [];
      inputIdx.current = 0;
      setDifficulty(d);
      setLevel(1);
      setPhase('watch');
      const first = Math.floor(Math.random() * DIFFICULTY_CONFIG[d].pads);
      sequence.current = [first];
      void playSequence();
    },
    [playSequence],
  );

  const advanceLevel = useCallback(() => {
    if (!difficulty || finished.current) return;
    const pads = DIFFICULTY_CONFIG[difficulty].pads;
    const next = Math.floor(Math.random() * pads);
    sequence.current.push(next);
    const newLevel = sequence.current.length;
    setLevel(newLevel);

    if (newLevel > MAX_MEMORY_LENGTH) {
      endGame(MAX_MEMORY_LENGTH);
      return;
    }

    setPhase('success');
    window.setTimeout(() => void playSequence(), 700);
  }, [difficulty, endGame, playSequence]);

  function handlePadPress(pad: number) {
    if (!difficulty || phase !== 'input' || playing.current) return;

    void (async () => {
      setLitPad(pad);
      playTone(PAD_FREQS[pad]);
      await wait(120);
      setLitPad(null);

      if (pad !== sequence.current[inputIdx.current]) {
        endGame(Math.max(0, sequence.current.length - 1));
        return;
      }

      inputIdx.current += 1;
      if (inputIdx.current >= sequence.current.length) {
        advanceLevel();
      }
    })();
  }

  if (phase === 'pick' || !config) {
    return (
      <div className="space-y-3">
        <p className="text-center text-sm text-slate-600">Memory sequence</p>
        <p className="text-center text-[11px] text-slate-400">
          Watch the pattern, then repeat it. One mistake ends the round.
        </p>
        <div className="grid gap-2">
          {(Object.keys(DIFFICULTY_CONFIG) as MemoryDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => startGame(d)}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:border-teal-300 hover:bg-teal-50"
            >
              <span className="text-sm font-semibold text-slate-700">
                {DIFFICULTY_CONFIG[d].label}
              </span>
              <span className="text-xs text-slate-500">
                {DIFFICULTY_CONFIG[d].hint}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const status =
    phase === 'watch'
      ? 'Watch the sequence…'
      : phase === 'input'
        ? `Your turn · level ${level}`
        : phase === 'success'
          ? 'Correct!'
          : `Best: ${resultLength} in a row`;

  const inputEnabled = phase === 'input';

  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-slate-600">
        {config.label} · {config.hint}
      </p>
      <p className="text-center text-xs font-medium text-teal-700" aria-live="polite">
        {status}
      </p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: config.pads }, (_, i) => (
          <button
            key={i}
            disabled={!inputEnabled}
            onClick={() => handlePadPress(i)}
            className={
              'aspect-square min-h-12 rounded-xl transition-all duration-100 ' +
              (litPad === i ? PAD_LIT[i] : PAD_COLORS[i]) +
              (inputEnabled
                ? ' opacity-100 hover:brightness-110'
                : ' opacity-80')
            }
            aria-label={`Pad ${i + 1}`}
          />
        ))}
      </div>
      <p className="text-center text-[11px] text-slate-400">
        Each square plays a tone. The pattern grows longer every round.
      </p>
    </div>
  );
}
