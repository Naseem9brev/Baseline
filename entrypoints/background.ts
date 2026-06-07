import {
  REMINDER_ALARM,
  scheduleDailyReminder,
  showReminderNotification,
} from '@/lib/reminder';
import { getSettings, onSettingsChanged } from '@/lib/settings';

/** Apply the user's reminder preference: schedule at their hour, or clear it. */
async function applyReminderFromSettings(): Promise<void> {
  const { reminderEnabled, reminderHour } = await getSettings();
  if (reminderEnabled) await scheduleDailyReminder(reminderHour);
  else await chrome.alarms.clear(REMINDER_ALARM);
}

export default defineBackground(() => {
  // Open the side panel when the user clicks the toolbar icon.
  chrome.sidePanel
    ?.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((err) => console.error('[Baseline] setPanelBehavior failed', err));

  // Schedule the daily reminder (honoring saved settings) on install + startup.
  chrome.runtime.onInstalled.addListener(() => void applyReminderFromSettings());
  chrome.runtime.onStartup.addListener(() => void applyReminderFromSettings());

  // Reschedule whenever the user changes the reminder time / toggle in Settings.
  onSettingsChanged(() => void applyReminderFromSettings());

  // When the daily alarm fires: notify, then re-schedule the next one.
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === REMINDER_ALARM) {
      showReminderNotification();
      void applyReminderFromSettings();
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

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'baseline:elevenlabs-tts') {
      void (async () => {
        try {
          const voiceId = String(msg.voiceId ?? '');
          const url =
            `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}` +
            '?output_format=mp3_44100_128';
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'xi-api-key': String(msg.apiKey ?? ''),
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
              text: String(msg.text ?? ''),
              model_id: String(msg.modelId ?? 'eleven_multilingual_v2'),
              voice_settings: {
                stability: 0.6,
                similarity_boost: 0.75,
                style: 0,
                use_speaker_boost: true,
              },
            }),
          });

          if (!res.ok) {
            const body = await res.text().catch(() => '');
            sendResponse({ ok: false, status: res.status, body });
            return;
          }

          const buffer = await res.arrayBuffer();
          sendResponse({ ok: true, audio: Array.from(new Uint8Array(buffer)) });
        } catch (err) {
          console.error('[Baseline] ElevenLabs TTS proxy failed', err);
          sendResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
        }
      })();
      return true;
    }
  });
});
