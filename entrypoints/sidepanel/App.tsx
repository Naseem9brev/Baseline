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
import { exportJson } from '@/lib/export';
import { seedDemoData } from '@/lib/seed';
import CheckinFlow from './CheckinFlow';
import Heatmap from './components/Heatmap';

type Tab = 'checkin' | 'history';

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
      <nav className="flex border-b border-slate-200 bg-white px-3">
        <TabButton active={tab === 'checkin'} onClick={() => setTab('checkin')}>
          Check-in
        </TabButton>
        <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
          History
        </TabButton>
      </nav>
      <main className="flex-1 overflow-y-auto p-4">
        {tab === 'checkin' ? (
          <CheckinTab today={today} />
        ) : (
          <HistoryTab records={records} />
        )}
      </main>
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ' +
        (active
          ? 'border-teal-600 text-teal-700'
          : 'border-transparent text-slate-500 hover:text-slate-700')
      }
    >
      {children}
    </button>
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
  const flash = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(''), 2500);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">Data & reminders</h2>
      <div className="mt-3 grid gap-2">
        <button
          onClick={async () => {
            await exportJson();
            flash('Export started.');
          }}
          className="rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-900"
        >
          Export for doctor (JSON)
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
  return `hsl(${hue} 65% 45%)`;
}
