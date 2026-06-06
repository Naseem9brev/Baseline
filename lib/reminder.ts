export const REMINDER_ALARM = 'baseline:daily-reminder';
export const DEFAULT_HOUR = 9;
const NOTIFICATION_ID = 'baseline:reminder';

/** Epoch millis of the next `hour:00` strictly in the future. */
export function nextReminderTime(hour = DEFAULT_HOUR, from: Date = new Date()): number {
  const next = new Date(from);
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= from.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime();
}

/**
 * One-time alarm that the background re-schedules each time it fires. We avoid
 * `periodInMinutes` so the reminder lands at a fixed wall-clock hour, and we never
 * use setTimeout (the MV3 service worker suspends and would drop it).
 */
export async function scheduleDailyReminder(hour = DEFAULT_HOUR): Promise<void> {
  await chrome.alarms.create(REMINDER_ALARM, { when: nextReminderTime(hour) });
}

export function showReminderNotification(): void {
  chrome.notifications.create(NOTIFICATION_ID, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon/128.png'),
    title: 'Baseline check-in',
    message: 'Take 60 seconds to log today’s baseline and keep your streak alive.',
    priority: 2,
  });
}
