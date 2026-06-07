import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import type { MemoryDifficulty, RawReactionFeatures } from '@/lib/analysis/types';
import { Ic } from '../components/icons';

const TAP_TRIALS = 3;
const CHOICE_TRIALS = 5;
const PHRASE = 'stay healthy every day';
const MAX_MEMORY_LENGTH = 15;
const FLASH_MS = 450;
const GAP_MS = 180;

const SUB_STEPS = [
  { key: 'reaction', label: 'Tap' },
  { key: 'choice', label: 'Arrows' },
  { key: 'memory', label: 'Memory' },
  { key: 'typing', label: 'Type' },
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
// On-palette pad fills (CSS values, applied via inline style). One flashes at a time.
const PAD_COLORS = [
  'var(--sage)',
  'var(--ginseng)',
  'var(--saffron)',
  'var(--jujube)',
  'var(--plum)',
  'var(--clay)',
  'var(--rose)',
  'var(--sage-deep)',
  'var(--ginseng-deep)',
];
const PAD_LIT = [
  'var(--sage-soft)',
  'var(--ginseng-soft)',
  'var(--saffron-soft)',
  'var(--jujube-soft)',
  'var(--plum-soft)',
  'var(--ginseng-soft)',
  'var(--sage-soft)',
  'var(--sage-soft)',
  'var(--ginseng-soft)',
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
    setSub('typing');
  }

  function handleTypingDone(wpm: number, accuracy: number) {
    onComplete({
      reactionMs,
      choiceReactionMs,
      choiceAccuracy,
      memoryMaxLength,
      memoryDifficulty,
      wpm,
      accuracy,
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
      ) : sub === 'memory' ? (
        <MemorySequenceTest onDone={handleMemoryDone} />
      ) : (
        <TypingTest onDone={handleTypingDone} />
      )}
    </div>
  );
}

function SubProgress({ idx }: { idx: number }) {
  return (
    <div className="steps flex-wrap" style={{ justifyContent: 'center' }}>
      {SUB_STEPS.map((s, i) => {
        const state = i < idx ? 'done' : i === idx ? 'on' : 'todo';
        return (
          <Fragment key={s.key}>
            <div className={`step-pill ${state}`} style={{ fontSize: 11 }}>
              <span className="step-num">
                {i < idx ? <Ic.check width={10} height={10} /> : i + 1}
              </span>
              {s.label}
            </div>
            {i < SUB_STEPS.length - 1 && (
              <span style={{ color: 'var(--ink-4)', fontSize: 12 }}>›</span>
            )}
          </Fragment>
        );
      })}
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

  const bgColor =
    state === 'ready'
      ? 'var(--sage)'
      : state === 'tooEarly'
        ? 'var(--jujube)'
        : 'var(--ink)';
  const label =
    state === 'ready'
      ? 'TAP!'
      : state === 'tooEarly'
        ? 'Too early — wait for green'
        : 'Wait for green…';

  return (
    <div className="space-y-3">
      <p className="text-center" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
        Reaction test · trial {Math.min(trial + 1, TAP_TRIALS)} of {TAP_TRIALS}
      </p>
      <button
        onClick={handleClick}
        className="grid h-48 w-full place-items-center rounded-xl text-xl font-bold transition-colors"
        style={{ background: bgColor, color: '#FBF3E6' }}
      >
        {label}
      </button>
      <p className="muted text-center" style={{ fontSize: 11 }}>
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

  const promptStyle =
    state === 'ready'
      ? { background: 'var(--ink)', color: '#FBF3E6' }
      : state === 'tooEarly' || state === 'wrong'
        ? { background: 'var(--jujube)', color: '#FBF3E6' }
        : { background: 'var(--line)', color: 'var(--ink-2)' };

  return (
    <div className="space-y-3">
      <p className="text-center" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
        Arrow test · trial {Math.min(trial + 1, CHOICE_TRIALS)} of {CHOICE_TRIALS}
      </p>
      <div
        className="grid h-32 w-full place-items-center rounded-xl text-5xl font-bold transition-colors"
        style={promptStyle}
        aria-live="polite"
      >
        {state === 'waiting' ? 'Wait for arrow…' : prompt}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleChoice('left')}
          className="rounded-xl py-4 text-lg font-bold"
          style={{ background: 'var(--ink)', color: '#FBF3E6' }}
        >
          ← Left
        </button>
        <button
          onClick={() => handleChoice('right')}
          className="rounded-xl py-4 text-lg font-bold"
          style={{ background: 'var(--ink)', color: '#FBF3E6' }}
        >
          Right →
        </button>
      </div>
      <p className="muted text-center" style={{ fontSize: 11 }}>
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
        <p className="text-center" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
          Memory sequence
        </p>
        <p className="muted text-center" style={{ fontSize: 11 }}>
          Watch the pattern, then repeat it. One mistake ends the round.
        </p>
        <div className="grid gap-2">
          {(Object.keys(DIFFICULTY_CONFIG) as MemoryDifficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => startGame(d)}
              className="card flat flex items-center justify-between text-left hover:bg-[var(--ginseng-wash)]"
              style={{ padding: '12px 16px' }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                {DIFFICULTY_CONFIG[d].label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
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
      <p className="text-center text-sm text-[var(--ink-2)]">
        {config.label} · {config.hint}
      </p>
      <p
        className="text-center text-xs font-medium text-saffron-deep"
        aria-live="polite"
      >
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
              (inputEnabled ? 'opacity-100 hover:brightness-110' : 'opacity-80')
            }
            style={{ background: litPad === i ? PAD_LIT[i] : PAD_COLORS[i] }}
            aria-label={`Pad ${i + 1}`}
          />
        ))}
      </div>
      <p className="muted text-center" style={{ fontSize: 11 }}>
        Each square plays a tone. The pattern grows longer every round.
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
      <p className="text-center" style={{ fontSize: 14, color: 'var(--ink-2)' }}>
        Type this phrase:
      </p>
      <div
        className="card flat wash serif-h text-center"
        style={{ fontSize: 18, letterSpacing: '0.02em' }}
      >
        {PHRASE}
      </div>
      <input
        autoFocus
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Start typing…"
        className="input"
      />
      <button onClick={submit} disabled={value.length === 0} className="btn btn-primary">
        Done
      </button>
    </div>
  );
}
