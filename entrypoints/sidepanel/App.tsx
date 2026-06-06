import { useEffect, useState } from 'react';
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
import CheckinFlow from './CheckinFlow';
import Heatmap from './components/Heatmap';
import SettingsView from './views/Settings';

type Tab = 'checkin' | 'history' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('checkin');
  const [records, setRecords] = useState<RecordMap>({});

  useEffect(() => {
    getRecords().then(setRecords);
    return onRecordsChanged(setRecords);
  }, []);

  const today = records[dateKey()];

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-800">
      <Header />
      <main className="flex-1 overflow-y-auto p-4">
        {tab === 'checkin' ? (
          <CheckinTab today={today} />
        ) : tab === 'history' ? (
          <HistoryTab records={records} />
        ) : (
          <SettingsView />
        )}
      </main>
      <BottomNav tab={tab} onTab={setTab} />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-500 px-4 py-3 text-white">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/20 text-lg font-bold">
        B
      </div>
      <div className="leading-tight">
        <h1 className="text-base font-semibold">Baseline</h1>
        <p className="text-[11px] text-white/80">Your daily health check-in</p>
      </div>
    </header>
  );
}

function BottomNav({
  tab,
  onTab,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
}) {
  const items: { id: Tab; label: string }[] = [
    { id: 'checkin', label: 'Check-in' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <nav className="flex border-t border-slate-200 bg-white px-2 pb-1 pt-1">
      {items.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTab(id)}
          className={
            'min-h-11 flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ' +
            (tab === id
              ? 'bg-teal-50 text-teal-700'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700')
          }
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

function CheckinTab({ today }: { today?: DayRecord }) {
  const [running, setRunning] = useState(false);

  if (running) {
    return <CheckinFlow onFinished={() => setRunning(false)} />;
  }

  return (
    <div className="space-y-4">
      <TodayCard today={today} />

      <button
        onClick={() => setRunning(true)}
        className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
      >
        {today ? 'Check in again' : 'Start daily check-in'}
      </button>
      <p className="text-center text-[11px] text-slate-400">
        3 quick steps · eyes, voice, reaction. 100% on-device — provisional, not
        medical advice.
      </p>
    </div>
  );
}

function TodayCard({ today }: { today?: DayRecord }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">Today</h2>
      {today ? (
        <>
          <div className="mt-3 flex items-center gap-4">
            <ScoreRing score={today.baselineScore} />
            <p className="flex-1 text-sm text-slate-600">{today.feedback}</p>
          </div>
          <div className="mt-3 space-y-1.5">
            {(Object.entries(today.stations) as [StationKey, StationScore][]).map(
              ([key, s]) => (
                <StationRow key={key} name={STATION_LABELS[key]} score={s} />
              ),
            )}
          </div>
        </>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          No check-in yet today. Take 60 seconds to log your baseline.
        </p>
      )}
    </div>
  );
}

const STATION_LABELS: Record<StationKey, string> = {
  face: 'Eye check',
  voice: 'Voice',
  reaction: 'Reaction',
};

function StationRow({ name, score }: { name: string; score: StationScore }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 text-slate-500">{name}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{
            width: `${score.score}%`,
            backgroundColor: scoreColor(score.score),
          }}
        />
      </div>
      <span className="w-6 text-right font-semibold tabular-nums text-slate-600">
        {score.score}
      </span>
    </div>
  );
}

function HistoryTab({ records }: { records: RecordMap }) {
  const streak = currentStreak(records);
  const total = totalCheckins(records);
  const avg = averageScore(records);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Streak" value={`${streak}`} suffix={streak === 1 ? 'day' : 'days'} />
        <Stat label="Check-ins" value={`${total}`} suffix="total" />
        <Stat label="Avg score" value={total ? `${avg}` : '—'} suffix="/ 100" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Last 13 weeks
        </h2>
        {total === 0 ? (
          <p className="text-sm text-slate-500">
            No check-ins yet — your grid fills in as you go.
          </p>
        ) : (
          <Heatmap records={records} />
        )}
      </div>

      <DataCard />
    </div>
  );
}

function DataCard() {
  const [msg, setMsg] = useState('');
  const [patientName, setPatientName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [exporting, setExporting] = useState(false);
  const flash = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">Data & reminders</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        NHS-style monitoring record for your GP — monthly summary, flagged months, and daily readings.
      </p>
      <label className="mt-3 block">
        <span className="text-xs font-medium text-slate-600">Patient name</span>
        <input
          type="text"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="As on your NHS record"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
        />
      </label>
      <label className="mt-2 block">
        <span className="text-xs font-medium text-slate-600">Date of birth (optional)</span>
        <input
          type="text"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          placeholder="DD/MM/YYYY"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"
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
          className="rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {exporting ? 'Preparing report…' : 'Export for GP appointment (PDF)'}
        </button>
        <button
          onClick={async () => {
            await exportJson();
            flash('JSON export started.');
          }}
          className="rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Export raw data (JSON)
        </button>
        <button
          onClick={() => {
            chrome.runtime.sendMessage({ type: 'baseline:test-reminder' });
            flash('Test reminder sent.');
          }}
          className="rounded-lg border border-slate-300 bg-white py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Test reminder
        </button>
        <button
          onClick={async () => {
            await seedDemoData();
            flash('Demo history added.');
          }}
          className="rounded-lg border border-dashed border-slate-300 bg-white py-2 text-xs font-medium text-slate-400 hover:bg-slate-50"
        >
          Seed demo data (dev)
        </button>
      </div>
      {msg && <p className="mt-2 text-center text-xs text-emerald-600">{msg}</p>}
      <p className="mt-2 text-center text-[10px] text-slate-400">
        Daily reminder at 9:00 AM · all data stays on this device.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
      <div className="text-2xl font-bold text-teal-700">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className="text-[10px] text-slate-300">{suffix}</div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div
      className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-lg font-bold text-white"
      style={{ backgroundColor: scoreColor(score) }}
    >
      {score}
    </div>
  );
}

function scoreColor(score: number): string {
  const hue = Math.round((score / 100) * 130); // 0 = red, 130 = green
  return `hsl(${hue}, 65%, 45%)`;
}
