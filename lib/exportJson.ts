import { dateKey, getRecords } from './storage';

/** Download all records as a JSON file (raw data snapshot). */
export async function exportJson(): Promise<void> {
  const records = await getRecords();
  const payload = {
    app: 'Baseline',
    schema: 1,
    exportedAt: new Date().toISOString(),
    note: 'Scores are provisional and not a clinical measure.',
    records,
  };
  const json = JSON.stringify(payload, null, 2);
  const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
  await chrome.downloads.download({
    url,
    filename: `baseline-export-${dateKey()}.json`,
    saveAs: true,
  });
}
