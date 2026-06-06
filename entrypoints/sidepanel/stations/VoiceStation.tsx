import { useCallback, useEffect, useRef, useState } from 'react';
import type { RawVoiceFeatures } from '@/lib/analysis/types';
import {
  buildPlainEnglishSummary,
  fetchAiVoiceSummary,
} from '@/lib/voiceInterpretation';
import { speakInstructions, stopInstructions } from '@/lib/elevenlabs';
import { hasLlmKey, llmProviderLabel, getLlmProvider } from '@/lib/llm';
import {
  analyzeSustainedVowel,
  mergeSampleChunks,
  type VoiceAnalysisResult,
} from '@/lib/praatfanVoiceAnalysis';
import {
  ensureMicrophonePermission,
  MIC_PERMISSION_COPY,
  openExtensionMicSettings,
  openMicPermissionTab,
  probeMicrophone,
  queryMicPermission,
} from '@/lib/micPermission';
import VoiceResultCard from '../components/VoiceResultCard';

const MIN_RECORD_MS = 1000;
const MAX_RECORD_MS = 30_000;

const INSTRUCTION =
  'Take a breath, then say “ahhhh” in a steady, comfortable tone — like at the doctor’s office.';

type Phase = 'ready' | 'recording' | 'processing' | 'results';
type InstructionAudio = 'idle' | 'loading' | 'speaking' | 'done' | 'no_key' | 'error';

export default function VoiceStation({
  onComplete,
  onError,
}: {
  onComplete: (raw: RawVoiceFeatures) => void;
  onError: (kind: 'denied' | 'error') => void;
}) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [level, setLevel] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [result, setResult] = useState<VoiceAnalysisResult | null>(null);
  const [summary, setSummary] = useState('');
  const [aiEnhancing, setAiEnhancing] = useState(false);
  const [usedAi, setUsedAi] = useState(false);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [needsMicAccess, setNeedsMicAccess] = useState(false);
  const [micBusy, setMicBusy] = useState(false);
  const [instructionAudio, setInstructionAudio] = useState<InstructionAudio>('loading');
  const [instructionError, setInstructionError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const recordStartRef = useRef(0);
  const recordingRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const rafRef = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const meterDataRef = useRef(new Float32Array(1024));
  const instructionRunRef = useRef(0);

  const playInstructions = useCallback(async () => {
    const runId = ++instructionRunRef.current;
    setInstructionError(null);
    setInstructionAudio('loading');
    const result = await speakInstructions(INSTRUCTION, {
      onPlaybackStart: () => {
        if (instructionRunRef.current === runId) setInstructionAudio('speaking');
      },
    });
    if (instructionRunRef.current !== runId) return;

    if (result.status === 'played') {
      setInstructionAudio('done');
      return;
    }
    if (result.status === 'no_key') {
      setInstructionAudio('no_key');
      setInstructionError('Add your ElevenLabs API key in Settings to hear instructions aloud.');
      return;
    }
    if (result.status === 'playback_blocked') {
      setInstructionAudio('error');
      setInstructionError('Tap Hear instructions to play audio.');
      return;
    }
    setInstructionAudio('error');
    setInstructionError(result.detail);
  }, []);

  const stopMeter = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setLevel(0);
  }, []);

  const teardownAudio = useCallback(() => {
    stopMeter();
    processorRef.current?.disconnect();
    processorRef.current = null;
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    chunksRef.current = [];
    recordingRef.current = false;
    spaceHeldRef.current = false;
  }, [stopMeter]);

  const ensureMic = useCallback(async (): Promise<boolean> => {
    if (streamRef.current && audioCtxRef.current) {
      setMicReady(true);
      setNeedsMicAccess(false);
      return true;
    }

    if (!(await probeMicrophone())) {
      setNeedsMicAccess(true);
      setMicReady(false);
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      await audioCtx.resume().catch(() => {});

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      const silent = audioCtx.createGain();
      silent.gain.value = 0;
      source.connect(processor);
      processor.connect(silent);
      silent.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (!recordingRef.current) return;
        const input = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(input));
      };

      streamRef.current = stream;
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      processorRef.current = processor;
      setMicReady(true);
      setNeedsMicAccess(false);
      return true;
    } catch (e) {
      const name = (e as DOMException)?.name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setNeedsMicAccess(true);
        setMicReady(false);
        return false;
      }
      onError('error');
      return false;
    }
  }, [onError]);

  const grantMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    setMicBusy(true);
    setHint(null);
    try {
      let ok = await ensureMicrophonePermission();
      if (!ok) {
        ok = await openMicPermissionTab().then(
          (granted) => granted && probeMicrophone(),
        );
      }
      if (ok) {
        setNeedsMicAccess(false);
        setHint(null);
        return true;
      }
      const state = await queryMicPermission();
      setHint(
        state === 'denied'
          ? MIC_PERMISSION_COPY.deniedNote
          : MIC_PERMISSION_COPY.sidePanelNote,
      );
      return false;
    } finally {
      setMicBusy(false);
    }
  }, []);

  const runMeter = useCallback(() => {
    const loop = () => {
      const analyser = analyserRef.current;
      if (analyser && recordingRef.current) {
        const data = meterDataRef.current;
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (const v of data) sum += v * v;
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(1, rms * 6));
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const showResults = useCallback(async (analysis: VoiceAnalysisResult) => {
    setResult(analysis);
    setPhase('results');
    setUsedAi(false);
    setAiProvider(null);
    setSummary(buildPlainEnglishSummary(analysis));

    const hasKey = await hasLlmKey();
    if (!hasKey) return;

    setAiEnhancing(true);
    try {
      const aiSummary = await fetchAiVoiceSummary(analysis);
      if (aiSummary) {
        setSummary(aiSummary);
        setUsedAi(true);
        const provider = await getLlmProvider();
        if (provider) setAiProvider(llmProviderLabel(provider));
      }
    } finally {
      setAiEnhancing(false);
    }
  }, []);

  const finishRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    const elapsed = performance.now() - recordStartRef.current;
    recordingRef.current = false;
    stopMeter();

    if (elapsed < MIN_RECORD_MS) {
      setPhase('ready');
      setHint('Hold a little longer — say “ahhhh” for at least one second.');
      chunksRef.current = [];
      return;
    }

    setPhase('processing');
    setHint(null);

    const sampleRate = audioCtxRef.current?.sampleRate ?? 44_100;
    const samples = mergeSampleChunks(chunksRef.current);
    chunksRef.current = [];
    const durationSec = Math.round((elapsed / 1000) * 10) / 10;

    try {
      const analysis = await analyzeSustainedVowel(samples, sampleRate, durationSec);
      teardownAudio();

      if (!analysis) {
        setPhase('ready');
        setHint('We could not pick up a steady vowel. Try again, a little louder.');
        return;
      }

      await showResults(analysis);
    } catch (err) {
      teardownAudio();
      setPhase('ready');
      console.error('[VoiceStation] analysis failed:', err);
      const msg = err instanceof Error ? err.message : String(err);
      const loadFailure =
        /404|wasm|fetch|network|failed to load/i.test(msg) ||
        err instanceof TypeError;
      setHint(
        loadFailure
          ? 'Voice engine failed to load — run npm install, reload the extension, and try again.'
          : 'Voice analysis failed — please try again.',
      );
    }
  }, [showResults, stopMeter, teardownAudio]);

  const startRecording = useCallback(async () => {
    if (
      recordingRef.current ||
      phase === 'processing' ||
      phase === 'results' ||
      instructionAudio === 'loading' ||
      instructionAudio === 'speaking'
    ) {
      return;
    }
    setHint(null);

    if (!(await probeMicrophone())) {
      setNeedsMicAccess(true);
      setHint(MIC_PERMISSION_COPY.sidePanelNote);
      return;
    }

    const ok = await ensureMic();
    if (!ok) return;

    chunksRef.current = [];
    recordStartRef.current = performance.now();
    recordingRef.current = true;
    setPhase('recording');
    runMeter();
  }, [ensureMic, instructionAudio, phase, runMeter]);

  const stopRecording = useCallback(() => {
    if (!recordingRef.current) return;
    void finishRecording();
  }, [finishRecording]);

  const toggleRecording = useCallback(async () => {
    if (phase === 'processing' || phase === 'results') return;
    if (recordingRef.current) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [phase, startRecording, stopRecording]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      e.preventDefault();
      if (
        recordingRef.current ||
        phase === 'processing' ||
        phase === 'results' ||
        instructionAudio === 'loading' ||
        instructionAudio === 'speaking'
      ) {
        return;
      }
      spaceHeldRef.current = true;
      void startRecording();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (!spaceHeldRef.current) return;
      e.preventDefault();
      spaceHeldRef.current = false;
      if (recordingRef.current) stopRecording();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [instructionAudio, phase, startRecording, stopRecording]);

  useEffect(() => {
    if (phase !== 'recording') return;
    const cap = window.setTimeout(() => {
      if (recordingRef.current) stopRecording();
    }, MAX_RECORD_MS);
    return () => window.clearTimeout(cap);
  }, [phase, stopRecording]);

  useEffect(() => () => teardownAudio(), [teardownAudio]);

  useEffect(() => {
    if (phase !== 'ready') return;
    void playInstructions();
    return () => {
      instructionRunRef.current += 1;
      stopInstructions();
    };
  }, [phase, playInstructions]);

  if (phase === 'results' && result) {
    return (
      <VoiceResultCard
        metrics={result}
        summary={summary}
        aiEnhancing={aiEnhancing}
        usedAi={usedAi}
        aiProvider={aiProvider}
        onContinue={() => onComplete(result)}
      />
    );
  }

  const recording = phase === 'recording';
  const instructionsBusy =
    instructionAudio === 'loading' || instructionAudio === 'speaking';
  const canRecord = !instructionsBusy && phase !== 'processing';

  return (
    <div className="space-y-4">
      <div className="card">
        <p className="eyebrow">Voice check</p>
        <p className="serif-h mt-2" style={{ fontSize: 18, lineHeight: 1.4 }}>
          {INSTRUCTION}
        </p>
        <p className="mt-3" style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
          Press the button to start, say “ahhhh”, then press again to stop. Or hold{' '}
          <kbd
            className="rounded border px-1.5 py-0.5 font-mono text-xs"
            style={{ borderColor: 'var(--line)', background: 'var(--paper-sunk)', color: 'var(--ink-2)' }}
          >
            Space
          </kbd>{' '}
          while you speak, then release.
        </p>
      </div>

      <div className="card flat wash grid place-items-center gap-4">
        <MicMeter level={level} active={recording} />

        <p className="text-center" style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
          {phase === 'processing'
            ? 'Analysing with praatfan…'
            : recording
              ? 'Recording… say “ahhhh” now'
              : instructionsBusy
                ? instructionAudio === 'loading'
                  ? 'Loading instructions…'
                  : 'Listen to the instructions…'
                : instructionError
                  ? instructionError
                  : instructionAudio === 'done'
                    ? 'Ready when you are'
                    : micReady
                      ? 'Ready when you are'
                      : 'Allow microphone access when prompted'}
        </p>

        <button
          type="button"
          disabled={instructionsBusy}
          onClick={() => void playInstructions()}
          className="btn btn-ghost"
        >
          {instructionAudio === 'loading'
            ? 'Loading…'
            : instructionAudio === 'speaking'
              ? 'Speaking…'
              : instructionAudio === 'done'
                ? 'Hear instructions again'
                : 'Hear instructions'}
        </button>

        <button
          type="button"
          disabled={phase === 'processing' || !canRecord}
          onClick={() => void toggleRecording()}
          className="btn btn-primary"
          style={recording ? { background: 'var(--jujube)', color: '#FBF3E6' } : undefined}
        >
          {phase === 'processing'
            ? 'Please wait…'
            : recording
              ? 'Stop recording'
              : 'Start recording'}
        </button>
      </div>

      {needsMicAccess ? (
        <div className="card tint space-y-2">
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{MIC_PERMISSION_COPY.sidePanelNote}</p>
          <button
            type="button"
            disabled={micBusy}
            onClick={() => void grantMicrophoneAccess().then((ok) => ok && void startRecording())}
            className="btn btn-primary"
          >
            {micBusy ? 'Waiting for Chrome…' : 'Allow microphone (opens tab)'}
          </button>
          <button type="button" onClick={openExtensionMicSettings} className="btn btn-ghost">
            Open extension microphone settings
          </button>
        </div>
      ) : null}

      {hint && !needsMicAccess ? (
        <p className="card tint" style={{ fontSize: 13.5, color: 'var(--ink-2)', padding: '10px 12px' }}>
          {hint}
        </p>
      ) : null}
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
              backgroundColor: on ? 'var(--ginseng)' : 'var(--paper-sunk)',
            }}
          />
        );
      })}
    </div>
  );
}
