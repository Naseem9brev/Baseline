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
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === 'baseline:test-reminder') {
      showReminderNotification();
      return;
    }

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
