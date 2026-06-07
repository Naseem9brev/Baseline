import { getRecords, setRecords, type DayRecord, type RecordMap } from './storage';

export interface ImportResult {
  /** Records found in the file. */
  fileCount: number;
  /** Records actually written (new dates, under merge mode). */
  added: number;
  /** Total records after the import. */
  total: number;
}

function isValidRecord(v: unknown): v is DayRecord {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.date === 'string' &&
    typeof r.baselineScore === 'number' &&
    typeof r.stations === 'object' &&
    r.stations !== null
  );
}

/**
 * Restore records from a Baseline JSON export (schema 1).
 * - `merge` (default): keep existing days, add only dates not already present.
 * - `replace`: overwrite the whole history with the file's records.
 * Throws on an unrecognized / malformed file.
 */
export async function importJson(
  file: File,
  mode: 'merge' | 'replace' = 'merge',
): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('That file isn’t valid JSON.');
  }

  const payload = parsed as { app?: unknown; schema?: unknown; records?: unknown };
  if (payload?.app !== 'Baseline' || payload?.schema !== 1) {
    throw new Error('Not a Baseline export file.');
  }
  if (!payload.records || typeof payload.records !== 'object') {
    throw new Error('No records found in that file.');
  }

  // Keep only well-formed records, keyed by their own date.
  const incoming: RecordMap = {};
  for (const rec of Object.values(payload.records as Record<string, unknown>)) {
    if (isValidRecord(rec)) incoming[rec.date] = rec;
  }
  const fileCount = Object.keys(incoming).length;
  if (fileCount === 0) throw new Error('No valid records found in that file.');

  const existing = await getRecords();
  let merged: RecordMap;
  let added: number;
  if (mode === 'replace') {
    merged = incoming;
    added = fileCount;
  } else {
    // Existing days win; only previously-missing dates are added.
    merged = { ...incoming, ...existing };
    added = Object.keys(incoming).filter((d) => !(d in existing)).length;
  }

  await setRecords(merged);
  return { fileCount, added, total: Object.keys(merged).length };
}
