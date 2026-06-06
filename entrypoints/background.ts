import {
  REMINDER_ALARM,
  scheduleDailyReminder,
  showReminderNotification,
} from '@/lib/reminder';

export default defineBackground(() => {
  // Open the side panel when the user clicks the toolbar icon.
  chrome.sidePanel
    ?.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('[Baseline] setPanelBehavior failed', err));

  // Schedule the daily reminder on install and on browser startup.
  chrome.runtime.onInstalled.addListener(() => scheduleDailyReminder());
  chrome.runtime.onStartup.addListener(() => scheduleDailyReminder());

  // When the daily alarm fires: notify, then re-schedule tomorrow's.
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === REMINDER_ALARM) {
      showReminderNotification();
      scheduleDailyReminder();
    }
  });

  // Clicking the notification opens the side panel in the focused window.
  chrome.notifications.onClicked.addListener(async () => {
    try {
      const win = await chrome.windows.getLastFocused();
      if (win.id != null) await chrome.sidePanel.open({ windowId: win.id });
    } catch (err) {
      console.error('[Baseline] open side panel from notification failed', err);
    }
  });

  // Let the side panel trigger a test notification (for the demo).
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'baseline:test-reminder') showReminderNotification();
  });
});
