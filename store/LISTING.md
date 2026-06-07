# Chrome Web Store listing — Baseline

Copy-paste content for the Web Store listing. Keep it in sync with the manifest in
`wxt.config.ts` and the privacy policy (`store/PRIVACY.md`, also hosted at `/privacy`).

---

## Name
Baseline — daily health check-in

## Summary (≤ 132 chars)
A private, 60-second daily check-in for your eyes, voice, and reaction. Track your baseline over time — 100% on your device.

## Category
Health & Fitness

## Language
English

---

## Detailed description

Baseline is a calm, private daily health check-in that takes about a minute.

Each day it runs three quick stations:
• Eyes — a short camera check estimates heart rate (optional cloud rPPG) and looks at blink and eye steadiness.
• Voice — hold an “ahhhh” for a few seconds; pitch jitter, shimmer, and clarity are measured locally.
• Reaction — quick tap, choice, memory, and typing mini-tests for a snapshot of focus and speed.

You get a single daily baseline score, a growing streak (with a little plant that grows as you keep it up), a year grid, and trend sparklines so you can notice changes over time. When you visit a doctor, export a tidy PDF monitoring record — or export/import raw JSON to back up and move your history.

Private by design:
• Everything runs on your device. Camera and microphone frames are processed locally and never uploaded or stored.
• Only computed scores and a few numbers are saved, in your browser.
• No accounts, no tracking, no ads.
• Optional AI summaries and accurate heart rate use services you enable with your own API key — and only your numbers (never audio or video) are sent.

Baseline provides provisional, non-clinical readings for personal trend tracking. It is not a medical device and not a substitute for professional medical advice.

---

## Permission justifications (for the review form)

| Permission | Why it's needed |
| --- | --- |
| `storage` | Save your check-in history and settings locally (`chrome.storage.local`). |
| `alarms` | Schedule the optional once-a-day reminder at your chosen time. |
| `notifications` | Show that daily reminder notification. |
| `sidePanel` | The entire app runs in the Chrome side panel. |
| `downloads` | Save the PDF (for your GP) and JSON export files you generate. |
| `tabs` | Open the side panel in the focused window from the toolbar icon / reminder. |

### Host permissions (all optional, only used with a user-supplied key)
| Host | Why |
| --- | --- |
| `https://api.rouast.com/*` | VitalLens cloud heart-rate estimate (only if a VitalLens key is added). |
| `https://api.z.ai/*` | Z.AI GLM summaries (only if a Z.AI key is added). |
| `https://generativelanguage.googleapis.com/*` | Google Gemini summaries (alternative to Z.AI). |
| `https://api.elevenlabs.io/*` | Spoken instructions (only if an ElevenLabs key is added). |

### Remote code
No remote code is executed. All logic ships in the package; the hosts above are data-only API calls the user opts into.

### Data usage disclosures (Privacy practices tab)
- Does the item collect user data? **It does not collect or transmit data by default.** Health readings stay on-device.
- If the optional API features are enabled by the user, only numeric metrics (or, for VitalLens, pixelated face frames deleted after processing) are sent to the user's chosen provider. No data is sold or used for advertising.
- Link the hosted privacy policy (see `store/PRIVACY.md`, deployed at `https://<landing-domain>/privacy`).

---

## Assets checklist (create before submitting)
- [ ] **Store icon** 128×128 PNG (from `public/icon/128.png`).
- [ ] **Screenshots** 1280×800 (or 640×400), 1–5 images. Suggested:
  1. Home — streak plant + “Begin today’s check-in”.
  2. A station mid-check (e.g. eye capture or voice).
  3. Today summary — baseline score + station breakdown.
  4. History — year grid + trend sparklines.
  5. Settings — reminder + privacy note.
- [ ] **Small promo tile** 440×280 PNG (optional but recommended).
- [ ] **Marquee promo** 1400×560 PNG (optional).
- [ ] Privacy policy URL live.
- [ ] Package zip from `npm run zip` → `.output/baseline-<version>-chrome.zip`.
