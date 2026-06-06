import { useEffect, useRef, useState } from 'react';
import type { RawVoiceFeatures } from '@/lib/analysis/types';

const RECORD_MS = 5000;
const SENTENCE = 'The quick brown fox jumps over the lazy dog.';
const VOICED_RMS = 0.02;

export default function VoiceStation({
  onComplete,
  onError,
}: {
  onComplete: (raw: RawVoiceFeatures) => void;
  onError: (kind: 'denied' | 'error') => void;
}) {
  const [phase, setPhase] = useState<'init' | 'recording'>('init');
  const [remaining, setRemaining] = useState(Math.ceil(RECORD_MS / 1000));
  const [level, setLevel] = useState(0);
  const levelRef = useRef(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let audioCtx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;
    const rmsSamples: number[] = [];

    async function run() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e) {
        if (!cancelled) {
          onError((e as DOMException)?.name === 'NotAllowedError' ? 'denied' : 'error');
        }
        return;
      }
      if (cancelled) return;

      audioCtx = new AudioContext();
      // May start suspended under the autoplay policy — resume so the analyser updates.
      await audioCtx.resume().catch(() => {});
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const data = new Float32Array(analyser.fftSize);

      setPhase('recording');
      const start = performance.now();

      const loop = () => {
        if (cancelled) return;
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += v * v;
        const rms = Math.sqrt(sum / data.length);
        rmsSamples.push(rms);
        levelRef.current = Math.min(1, rms * 6);
        setLevel(levelRef.current);

        const elapsed = performance.now() - start;
        setRemaining(Math.max(0, Math.ceil((RECORD_MS - elapsed) / 1000)));
        if (elapsed >= RECORD_MS) {
          finish();
          return;
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    function finish() {
      const voiced = rmsSamples.filter((r) => r > VOICED_RMS).length;
      const durationSec = rmsSamples.length
        ? (voiced / rmsSamples.length) * (RECORD_MS / 1000)
        : 0;
      const raw: RawVoiceFeatures = { rms: mean(rmsSamples), durationSec };
      cleanup();
      onComplete(raw);
    }

    function cleanup() {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      audioCtx?.close().catch(() => {});
    }

    run();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wide text-slate-400">Read aloud</p>
        <p className="mt-1 text-lg font-medium text-slate-700">“{SENTENCE}”</p>
      </div>

      <div className="grid place-items-center gap-3 rounded-xl bg-slate-900 p-6">
        <MicMeter level={level} active={phase === 'recording'} />
        <p className="text-sm text-white">
          {phase === 'init' ? 'Allow microphone access…' : `Listening… ${remaining}s`}
        </p>
      </div>
    </div>
  );
}

function MicMeter({ level, active }: { level: number; active: boolean }) {
  const bars = 5;
  return (
    <div className="flex h-16 items-end gap-1.5">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i + 1) / bars;
        const on = active && level >= threshold * 0.6;
        return (
          <div
            key={i}
            className="w-3 rounded-full transition-all"
            style={{
              height: `${20 + i * 10}px`,
              backgroundColor: on ? '#34d399' : 'rgba(255,255,255,0.2)',
            }}
          />
        );
      })}
    </div>
  );
}

function mean(a: number[]): number {
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}
