export {}; // module scope (avoids global clash with mic-permission/main.ts)

const statusEl = document.getElementById('status')!;

async function run() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    statusEl.textContent =
      'Camera access granted. This tab will close — return to the Baseline side panel and start the eye test.';
    chrome.runtime.sendMessage({ type: 'baseline:camera-permission-granted' });
    window.setTimeout(() => window.close(), 1200);
  } catch (e) {
    const name = (e as DOMException)?.name ?? 'Error';
    statusEl.textContent =
      name === 'NotAllowedError'
        ? 'Camera was blocked. Close this tab, open Baseline → Settings, use the extension site settings, and set Camera to Allow.'
        : 'Could not access the camera. Close this tab and try again from the Baseline side panel.';
    chrome.runtime.sendMessage({ type: 'baseline:camera-permission-denied' });
  }
}

void run();
