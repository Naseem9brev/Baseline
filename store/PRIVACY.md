# Baseline — Privacy Policy

_Last updated: 2026_

Baseline is a Chrome extension that runs a short daily health check-in. It is built to keep
your data on your own device. This policy explains exactly what is and isn’t collected. The
same policy is published on the landing site at `/privacy`.

## What stays on your device
Camera and microphone frames used for the eye and voice checks are processed locally in your
browser and are **never uploaded or stored**. Your check-in history — combined scores and a few
numeric features (never photos, video, or audio) — is saved only in your browser’s local
extension storage (`chrome.storage.local`). It is removed if you uninstall the extension or
clear its browsing data.

## What we don’t do
- No accounts, sign-in, or user profiles.
- No analytics, tracking, advertising, or third-party trackers.
- No selling or sharing of data. There is no Baseline server that receives your data.

## Optional third-party services (only if you opt in)
Some optional features call external APIs **using a key you provide** in Settings. When enabled,
only the minimum data needed is sent, directly from your browser to that provider:

- **Heart-rate estimate (VitalLens / api.rouast.com):** small, pixelated face frames are sent to
  estimate heart rate and are deleted after processing. Only if you add a VitalLens key.
- **AI summaries (Z.AI / api.z.ai, or Google Gemini / generativelanguage.googleapis.com):** only
  your numeric results are sent — never audio or video. Only if you add a key.
- **Spoken instructions (ElevenLabs / api.elevenlabs.io):** only the instruction text is sent.
  Only if you add a key.

If you don’t add any keys, Baseline runs fully offline. Your API keys are stored only on your
device.

## Permissions
The extension requests only what it needs: local storage, alarms and notifications (for your
daily reminder), the side panel, downloads (for PDF/JSON export), and tabs (to open the panel).
Camera and microphone use the browser’s standard prompt and are not background permissions.

## Medical disclaimer
Baseline provides provisional, non-clinical readings for personal trend tracking. It is not a
medical device and not a substitute for professional medical advice.

## Contact
Questions or requests? Open an issue at https://github.com/Naseem9brev/Baseline.
