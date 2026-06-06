/**
 * Chrome side panels cannot show the microphone permission prompt — requests fail
 * with NotAllowedError ("Permission dismissed"). Grant access once in a full tab,
 * then getUserMedia works in the side panel for the extension origin.
 */

const MSG = {
  granted: 'baseline:mic-permission-granted',
  denied: 'baseline:mic-permission-denied',
} as const;

export type MicPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export async function queryMicPermission(): Promise<MicPermissionState> {
  try {
    const result = await navigator.permissions.query({
      name: 'microphone' as PermissionName,
    });
    if (result.state === 'granted') return 'granted';
    if (result.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unknown';
  }
}

/** Probe whether getUserMedia works right now (without keeping the stream). */
export async function probeMicrophone(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

/** Opens an extension tab that can display Chrome's mic permission prompt. */
export function openMicPermissionTab(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      chrome.runtime.onMessage.removeListener(onMessage);
      resolve(ok);
    };

    const onMessage = (
      message: unknown,
    ) => {
      if (typeof message !== 'object' || message === null) return;
      const type = (message as { type?: string }).type;
      if (type === MSG.granted) finish(true);
      if (type === MSG.denied) finish(false);
    };

    chrome.runtime.onMessage.addListener(onMessage);

    chrome.tabs.create({ url: chrome.runtime.getURL('mic-permission.html') }, (tab) => {
      const tabId = tab.id;
      if (!tabId) {
        finish(false);
        return;
      }

      const onRemoved = (removedId: number) => {
        if (removedId === tabId) {
          chrome.tabs.onRemoved.removeListener(onRemoved);
          window.setTimeout(() => finish(false), 300);
        }
      };
      chrome.tabs.onRemoved.addListener(onRemoved);
    });
  });
}

/** Ensure mic access for the side panel; may open a helper tab once. */
export async function ensureMicrophonePermission(): Promise<boolean> {
  if (await probeMicrophone()) return true;

  const state = await queryMicPermission();
  if (state === 'denied') return false;

  return openMicPermissionTab().then(async (ok) => ok && probeMicrophone());
}

export function openExtensionMicSettings(): void {
  const id = chrome.runtime.id;
  chrome.tabs.create({
    url: `chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2F${id}`,
  });
}

export const MIC_PERMISSION_COPY = {
  sidePanelNote:
    'Chrome cannot show the microphone prompt inside the side panel. Tap below to allow access in a short helper tab, then return here.',
  deniedNote:
    'Microphone access is blocked for Baseline. Open extension settings and set Microphone to Allow, then try again.',
} as const;
