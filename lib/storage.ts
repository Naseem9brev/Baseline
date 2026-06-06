import type { RawFeatures, StationKey, StationScore } from './analysis/types';

/** One day's check-in result. Stores only computed scores + raw feature numbers — never raw media. */
export interface DayRecord {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** 0..100 combined score (provisional, non-clinical). */
  baselineScore: number;
  /** Per-station provisional scores. */
  stations: Partial<Record<StationKey, StationScore>>;
  /** Raw captured features, kept so future clinical logic can re-score. */
  raw: RawFeatures;
  /** One-line feedback shown after the check-in. */
  feedback: string;
  /** Epoch millis when the record was created. */
  createdAt: number;
}

const KEY = 'baseline:records';

/** All records keyed by date string. */
export type RecordMap = Record<string, DayRecord>;

export async function getRecords(): Promise<RecordMap> {
  const res = await chrome.storage.local.get(KEY);
  return (res[KEY] as RecordMap) ?? {};
}

export async function getRecord(date: string): Promise<DayRecord | undefined> {
  return (await getRecords())[date];
}

export async function saveRecord(rec: DayRecord): Promise<void> {
  const all = await getRecords();
  all[rec.date] = rec;
  await chrome.storage.local.set({ [KEY]: all });
}

export async function setRecords(all: RecordMap): Promise<void> {
  await chrome.storage.local.set({ [KEY]: all });
}

export async function clearRecords(): Promise<void> {
  await chrome.storage.local.remove(KEY);
}

/** Local date as YYYY-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Subscribe to record changes (e.g. background seeding, other contexts). Returns an unsubscribe fn. */
export function onRecordsChanged(cb: (records: RecordMap) => void): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area === 'local' && changes[KEY]) {
      cb((changes[KEY].newValue as RecordMap) ?? {});
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
