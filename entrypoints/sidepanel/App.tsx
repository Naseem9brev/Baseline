import { useEffect, useMemo, useState } from 'react';
import {
  dateKey,
  getRecords,
  onRecordsChanged,
  type DayRecord,
  type RecordMap,
} from '@/lib/storage';
import type { StationKey, StationScore } from '@/lib/analysis/types';
import { averageScore, currentStreak, totalCheckins } from '@/lib/stats';
import { exportJson, exportPdf } from '@/lib/export';
import { seedDemoData } from '@/lib/seed';
import { getSettings } from '@/lib/settings';
import CheckinFlow from './CheckinFlow';
import SettingsView from './views/Settings';
import Onboarding from './components/Onboarding';
import Brand from './components/Brand';
import { Ic } from './components/icons';
import StatusPill, { statusFromScore } from './components/StatusPill';
import StreakPlant, { streakWord } from './components/StreakPlant';
import ActivityGrid, { GridLegend } from './components/ActivityGrid';
import Sparkline from './components/Sparkline';
import ReadyChecklist from './components/ReadyChecklist';

type Tab = 'home' | 'today' | 'history';

const STATION_LABELS: Record<StationKey, string> = {
  face: 'Eye check',
  voice: 'Voice',
  reaction: 'Reaction',
};

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [records, setRecords] = useState<RecordMap>({});
  // undefined = still loading the flag; gate the app until we know.
  const [onboarded, setOnboarded] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    getRecords().then(setRecords);
    return onRecordsChanged(setRecords);
  }, []);

  useEffect(() => {
    getSettings().then((s) => setOnboarded(s.onboardingComplete));
  }, []);

  const today = records[dateKey()];
  const streak = currentStreak(records);
  const latest = useMemo(() => latestRecord(records), [records]);

  function beginCheckin() {
    setRunning(true);
    setTab('today');
  }

  if (onboarded === undefined) return <div className="app" />;
  if (!onboarded) return <Onboarding onDone={() => setOnboarded(true)} />;

  return (
    <div className="app">
      <header className="topbar">
        <div className="flex items-center gap-2">
          <Brand size={26} radius={8} />
          <span className="serif-h" style={{ fontSize: 18 }}>
            Baseline
          </span>
        </div>
        <button
          type="button"
          aria-label="Settings"
          title={settingsOpen ? 'Close settings' : 'Settings'}
          onClick={() => setSettingsOpen((s) => !s)}
          className="settings-btn"
          style={settingsOpen ? { color: 'var(--ginseng-deep)', background: 'var(--ginseng-wash)' } : undefined}
        >
          {settingsOpen ? <Ic.x width={18} height={18} /> : <Ic.gear width={18} height={18} />}
          <span>{settingsOpen ? 'Close' : 'Settings'}</span>
        </button>
      </header>

      <main className="app-scroll">
        {settingsOpen ? (
          <SettingsView />
        ) : tab === 'home' ? (
          <HomeView
            today={today}
            streak={streak}
            latest={latest}
            onBegin={beginCheckin}
          />
        ) : tab === 'today' ? (
          <TodayView
            today={today}
            running={running}
            onStart={() => setRunning(true)}
            onFinished={() => setRunning(false)}
          />
        ) : (
          <HistoryView records={records} streak={streak} />
        )}
      </main>

      {!settingsOpen && (
        <>
          <p className="appfoot">100% on-device — provisional, not medical advice.</p>
          <BottomNav tab={tab} onTab={setTab} />
        </>
      )}
    </div>
  );
}

function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const items: { id: Tab; label: string; Icon: (typeof Ic)[keyof typeof Ic] }[] = [
    { id: 'home', label: 'Home', Icon: Ic.home },
    { id: 'today', label: 'Today', Icon: Ic.tests },
    { id: 'history', label: 'History', Icon: Ic.history },
  ];
  return (
    <nav className="nav">
      {items.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(id)}
          className={'nav-item' + (tab === id ? ' on' : '')}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ───────────────────────── Home ───────────────────────── */
function HomeView({
  today,
  streak,
  latest,
  onBegin,
}: {
  today?: DayRecord;
  streak: number;
  latest?: DayRecord;
  onBegin: () => void;
}) {
  const now = new Date();
  const hour = now.getHours();
  const partOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="center-col" style={{ gap: 4 }}>
      <p className="eyebrow" style={{ marginTop: 4 }}>
        {dateLabel}
      </p>
      <h1 className="serif-h" style={{ fontSize: 26, margin: '4px 0 6px' }}>
        Good {partOfDay}
      </h1>

      <StreakPlant streak={streak} size={188} />

      <div className="tabnum serif-h" style={{ fontSize: 34, marginTop: 6 }}>
        {streak}
        <span style={{ fontSize: 15, color: 'var(--ink-3)' }}>
          {' '}
          day{streak === 1 ? '' : 's'}
        </span>
      </div>
      <p className="muted" style={{ fontSize: 13.5, margin: '2px 0 12px' }}>
        {streakWord(streak)}
      </p>

      {latest && <StatusPill status={statusFromScore(latest.baselineScore)} />}

      <button
        onClick={onBegin}
        className="card tint flex w-full items-center gap-3 text-left"
        style={{ marginTop: 18 }}
      >
        <span
          className="grid place-items-center rounded-xl"
          style={{ width: 38, height: 38, background: 'var(--ginseng)', color: '#FBF3E6', flex: '0 0 auto' }}
        >
          <Ic.tests width={20} height={20} />
        </span>
        <span className="flex-1">
          <span className="serif-h block" style={{ fontSize: 16 }}>
            {today ? 'Check in again' : "Begin today's check-in"}
          </span>
          <span className="muted block" style={{ fontSize: 12 }}>
            About 60 seconds · eyes, voice, reaction
          </span>
        </span>
        <Ic.arrow width={20} height={20} style={{ color: 'var(--ginseng-deep)', flex: '0 0 auto' }} />
      </button>
    </div>
  );
}

/* ───────────────────────── Today (check-in) ───────────────────────── */
function TodayView({
  today,
  running,
  onStart,
  onFinished,
}: {
  today?: DayRecord;
  running: boolean;
  onStart: () => void;
  onFinished: () => void;
}) {
  if (running) return <CheckinFlow onFinished={onFinished} />;

  return (
    <div className="space-y-4">
      {today ? (
        <div className="card">
          <p className="eyebrow">Today</p>
          <div className="mt-3 flex items-center gap-3">
            <StatusPill status={statusFromScore(today.baselineScore)} />
            <span className="tabnum serif-h" style={{ fontSize: 22 }}>
              {today.baselineScore}
            </span>
          </div>
          <p className="muted mt-2" style={{ fontSize: 13.5 }}>
            {today.feedback}
          </p>
          <div className="mt-3 space-y-2">
            {(Object.entries(today.stations) as [StationKey, StationScore][]).map(
              ([key, s]) => (
                <StationRow key={key} name={STATION_LABELS[key]} score={s} />
              ),
            )}
          </div>
        </div>
      ) : (
        <ReadyChecklist />
      )}

      <button onClick={onStart} className="btn btn-primary">
        {today ? 'Check in again' : 'Start daily check-in'}
      </button>
    </div>
  );
}

function StationRow({ name, score }: { name: string; score: StationScore }) {
  const color =
    score.score >= 70 ? 'var(--sage)' : score.score >= 45 ? 'var(--saffron)' : 'var(--jujube)';
  return (
    <div className="flex items-center gap-2" style={{ fontSize: 12.5 }}>
      <span className="muted" style={{ width: 78, flex: '0 0 auto' }}>
        {name}
      </span>
      <div className="track" style={{ flex: 1 }}>
        <i style={{ width: `${score.score}%`, background: color }} />
      </div>
      <span className="tabnum" style={{ width: 24, textAlign: 'right', color: 'var(--ink-2)', fontWeight: 600 }}>
        {score.score}
      </span>
    </div>
  );
}

/* ───────────────────────── History ───────────────────────── */
function HistoryView({ records, streak }: { records: RecordMap; streak: number }) {
  const total = totalCheckins(records);
  const avg = averageScore(records);
  const sorted = useMemo(
    () => Object.values(records).sort((a, b) => a.date.localeCompare(b.date)),
    [records],
  );
  const series = (key: StationKey) =>
    sorted.map((r) => r.stations[key]?.score).filter((n): n is number => n != null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={`${streak}`} suffix={streak === 1 ? 'day' : 'days'} />
        <Stat label="Check-ins" value={`${total}`} suffix="total" />
        <Stat label="Avg score" value={total ? `${avg}` : '—'} suffix="/ 100" />
      </div>

      <div className="card">
        <p className="eyebrow">Last year</p>
        {total === 0 ? (
          <p className="muted mt-2" style={{ fontSize: 14 }}>
            No check-ins yet — your grid fills in as you go.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <ActivityGrid records={records} />
            <GridLegend />
          </div>
        )}
      </div>

      {total >= 2 && (
        <div className="card">
          <p className="eyebrow">Trends</p>
          <div className="mt-3 space-y-3">
            <TrendRow label="Eye check" data={series('face')} color="var(--sage)" />
            <TrendRow label="Voice" data={series('voice')} color="var(--saffron)" />
            <TrendRow label="Reaction" data={series('reaction')} color="var(--sage)" />
          </div>
        </div>
      )}

      <ExportCard />
    </div>
  );
}

function TrendRow({ label, data, color }: { label: string; data: number[]; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="muted" style={{ fontSize: 13 }}>
        {label}
      </span>
      {data.length >= 2 ? (
        <Sparkline data={data} color={color} />
      ) : (
        <span className="muted" style={{ fontSize: 12 }}>
          not enough data
        </span>
      )}
    </div>
  );
}

function ExportCard() {
  const [msg, setMsg] = useState('');
  const [patientName, setPatientName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [exporting, setExporting] = useState(false);
  const flash = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="card">
      <p className="eyebrow">For your GP</p>
      <p className="muted mt-1" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
        A monitoring record — monthly summary, flagged months, and daily readings.
      </p>
      <label className="mt-3 block">
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Patient name
        </span>
        <input
          className="input mt-1"
          style={{ fontSize: 15 }}
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="As on your record"
        />
      </label>
      <label className="mt-2 block">
        <span className="muted" style={{ fontSize: 12.5, fontWeight: 600 }}>
          Date of birth (optional)
        </span>
        <input
          className="input mt-1"
          style={{ fontSize: 15 }}
          type="text"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          placeholder="DD/MM/YYYY"
        />
      </label>
      <div className="mt-3 grid gap-2">
        <button
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            flash('Preparing your report…');
            try {
              await exportPdf({
                patientLabel: patientName.trim(),
                dateOfBirth: dateOfBirth.trim(),
              });
              flash('PDF export started.');
            } catch {
              flash('Export failed — try again.');
            } finally {
              setExporting(false);
            }
          }}
          className="btn btn-primary"
          style={{ fontSize: 15 }}
        >
          {exporting ? 'Preparing report…' : 'Export for GP appointment (PDF)'}
        </button>
        <button onClick={async () => { await exportJson(); flash('JSON export started.'); }} className="btn btn-quiet">
          Export raw data (JSON)
        </button>
        <button
          onClick={async () => {
            await seedDemoData();
            flash('Demo history added.');
          }}
          className="btn btn-quiet"
          style={{ fontSize: 12.5, color: 'var(--ink-3)', borderStyle: 'dashed' }}
        >
          Seed demo data (dev)
        </button>
      </div>
      {msg && (
        <p className="mt-2 text-center" style={{ fontSize: 12, color: 'var(--sage-deep)' }}>
          {msg}
        </p>
      )}
      <p className="muted mt-2 text-center" style={{ fontSize: 10.5 }}>
        Set your daily reminder in Settings · all data stays on this device.
      </p>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix: string }) {
  return (
    <div className="card" style={{ padding: 12, textAlign: 'center' }}>
      <div className="tabnum serif-h" style={{ fontSize: 24, color: 'var(--ginseng)' }}>
        {value}
      </div>
      <div className="muted" style={{ fontSize: 11 }}>
        {label}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-4)' }}>{suffix}</div>
    </div>
  );
}

function latestRecord(records: RecordMap): DayRecord | undefined {
  const keys = Object.keys(records).sort();
  const k = keys[keys.length - 1];
  return k ? records[k] : undefined;
}
