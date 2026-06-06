/**
 * Chrome side panels cannot show the camera permission prompt — requests fail
 * with NotAllowedError ("Permission dismissed"). Grant access once in a full tab,
 * then getUserMedia works in the side panel for the extension origin.
 *
 * Mirrors lib/micPermission.ts (the voice test) for the camera (eye test).
 */

const MSG = {
  granted: 'baseline:camera-permission-granted',
  denied: 'baseline:camera-permission-denied',
} as const;

export type CameraPermissionState = 'granted' | 'denied' | 'prompt' | 'unknown';

export async function queryCameraPermission(): Promise<CameraPermissionState> {
  try {
    const result = await navigator.permissions.query({
      name: 'camera' as PermissionName,
    });
    if (result.state === 'granted') return 'granted';
    if (result.state === 'denied') return 'denied';
    return 'prompt';
  } catch {
    return 'unknown';
  }
}

/** Probe whether getUserMedia(video) works right now (without keeping the stream). */
export async function probeCamera(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

/** Opens an extension tab that can display Chrome's camera permission prompt. */
export function openCameraPermissionTab(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      chrome.runtime.onMessage.removeListener(onMessage);
      resolve(ok);
    };

    const onMessage = (message: unknown) => {
      if (typeof message !== 'object' || message === null) return;
      const type = (message as { type?: string }).type;
      if (type === MSG.granted) finish(true);
      if (type === MSG.denied) finish(false);
    };

    chrome.runtime.onMessage.addListener(onMessage);

    chrome.tabs.create(
      { url: chrome.runtime.getURL('camera-permission.html') },
      (tab) => {
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
      },
    );
  });
}

/**
 * Ensure camera access for the side panel; may open a helper tab once.
 *
 * IMPORTANT: we do NOT call getUserMedia here to "probe" — in a side panel that
 * call can hang indefinitely when permission hasn't been granted. We gate on the
 * Permissions API instead, and grant via a helper tab where Chrome can prompt.
 */
export async function ensureCameraPermission(): Promise<boolean> {
  const state = await queryCameraPermission();
  if (state === 'granted') return true;
  if (state === 'denied') return false;
  // 'prompt' or 'unknown' → let the user grant in a full helper tab.
  return openCameraPermissionTab();
}

/** Opens the extension's site settings (camera + microphone live on the same page). */
export function openExtensionCameraSettings(): void {
  const id = chrome.runtime.id;
  chrome.tabs.create({
    url: `chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2F${id}`,
  });
}

export const CAMERA_PERMISSION_COPY = {
  sidePanelNote:
    'Chrome cannot show the camera prompt inside the side panel. Tap below to allow access in a short helper tab, then return here.',
  deniedNote:
    'Camera access is blocked for Baseline. Open extension settings and set Camera to Allow, then try again.',
} as const;
