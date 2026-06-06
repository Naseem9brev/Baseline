const statusEl = document.getElementById('status')!;

async function run() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    statusEl.textContent =
      'Microphone access granted. This tab will close — return to the Baseline side panel and start the voice test.';
    chrome.runtime.sendMessage({ type: 'baseline:mic-permission-granted' });
    window.setTimeout(() => window.close(), 1200);
  } catch (e) {
    const name = (e as DOMException)?.name ?? 'Error';
    statusEl.textContent =
      name === 'NotAllowedError'
        ? 'Microphone was blocked. Close this tab, open Baseline → Settings, and use “Open extension microphone settings”, then set Microphone to Allow.'
        : 'Could not access the microphone. Close this tab and try again from the Baseline side panel.';
    chrome.runtime.sendMessage({ type: 'baseline:mic-permission-denied' });
  }
}

void run();
