# Baseline

Your daily health **baseline** — a 60-second, on-device check-in as a Chrome side panel.

Each day you run three quick stations and get one **Baseline Score**, a GitHub-style
streak heatmap to stay motivated, a daily reminder, and a doctor-friendly export.

- 👁 **Eye check** — real on-device face/eye tracking via MediaPipe (runs locally, no server).
- 🎙 **Voice** — read one sentence; basic on-device audio features.
- ⌨️ **Reaction** — a quick reaction-time + typing mini-game.

> ⚠️ **Scores are provisional, not medical advice.** The clinical interpretation of
> what eyes / skin / voice / typing reveal about health is intentionally *not* baked in
> yet — it will be defined with clinicians and dropped in behind `lib/analysis/`
> (see `lib/analysis/types.ts`). Today's scores are placeholders so the full flow works.

## Privacy

Everything runs **on your device**. Camera/microphone frames are processed locally and
**never uploaded or stored** — only computed scores and a few numeric features are saved
to `chrome.storage.local`. Export is a local file you control.

## Develop

```bash
npm install        # also downloads WXT + generates types
npm run dev        # WXT dev server with auto-reload
```

## Add to Chrome (2 steps)

1. Build it: `npm run build`
2. Open `chrome://extensions`, enable **Developer mode** (top-right), click
   **Load unpacked**, and select the `.output/chrome-mv3` folder.

Then click the **Baseline** toolbar icon to open the side panel. Use **History → Seed
demo data** to populate the heatmap, and **Test reminder** to fire a notification.

## Publishing

To publish to the Chrome Web Store, run `npm run zip` (→ `.output/baseline-<version>-chrome.zip`)
and follow [`store/SUBMIT.md`](store/). Listing copy, permission justifications, and the
privacy policy live in [`store/`](store/).

## Tech

- [WXT](https://wxt.dev) (MV3) + React + TypeScript + Tailwind
- [`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision)
  Face Landmarker — model + wasm bundled under `public/mediapipe/` for offline use
- `chrome.alarms` + `chrome.notifications` for the daily reminder
- `chrome.storage.local` for data, `chrome.downloads` for export

## Project layout

```
entrypoints/
  background.ts          # side-panel behavior + daily reminder alarm
  sidepanel/             # the React app (Check-in | History)
    stations/            # FaceStation, VoiceStation, ReactionStation
lib/
  analysis/              # ⚠ placeholder scoring seam — clinical logic defined later
  storage.ts  stats.ts  reminder.ts  export.ts  seed.ts  mediapipe.ts
public/
  mediapipe/             # bundled model + wasm
  icon/                  # generated icons
```
