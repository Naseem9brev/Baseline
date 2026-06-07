# Baseline — Design Handoff

> A redesign of the Baseline Chrome side panel. This document carries the **story**, the
> **visual system**, and a **component-by-component map** from the static prototype
> (`Baseline UI/`) to your real WXT + React + Tailwind extension. Hand it to Claude Code
> as the source of truth when re-skinning the app.

---

## 1. The story & vision

Baseline is a sixty-second daily health check-in. The old UI used a teal→emerald gradient on
slate — the generic "health app" look. The redesign moves to a calmer, more considered place:

**"A daily health check-in that feels like tea, not a test."**

The palette is borrowed from a traditional-medicine herb shelf — dried **saffron**, **ginseng
amber**, **sage**, **jujube red**, **dried plum** — muted, warm, never bright. It reads as
*care* and *calm* without the clichéd clinical green/orange. Everything sits on **warm paper**,
not white.

Three principles drive every screen:

1. **Quietly clinical, warmly human.** Precise data, soft delivery. No alarm-red, no shouting numbers.
2. **No pass/fail.** Copy always frames results as "noticing a pattern," never judging.
3. **A living streak.** The hero of the Home screen is a **plant that grows as your streak grows** —
   a seedling on day 3, a bud by day 12, a full saffron bloom by day 64. It rewards showing up
   without gamified noise.

The product stays **private by design** — camera/mic processed on-device, only numbers stored —
and **elderly-friendly**: body text never below ~15–18px, 44px+ touch targets, generous spacing.

---

## 2. Visual system

### 2.1 Color tokens

All tokens live in `Baseline UI/styles.css` under `:root`. **Saffron is the primary.**

> ⚠️ **Naming quirk to fix on the way in:** for historical reasons the CSS variable that holds the
> primary **saffron** is still named `--ginseng`, and the **Monitor** amber-brown is named
> `--saffron`. When you port this, rename them to something honest like `--primary` / `--amber`.
> The table below lists the *role* alongside the current variable name.

| Role | Variable (current) | Hex | Use |
|---|---|---|---|
| **Primary — Saffron** | `--ginseng` | `#B8772B` | buttons, brand mark, active nav, streak number, plant bloom & baseline line |
| Primary deep | `--ginseng-deep` | `#95601E` | pressed/hover, text on wash |
| Primary soft | `--ginseng-soft` | `#EAD4AC` | borders on tinted cards |
| Primary wash | `--ginseng-wash` | `#F7EFDD` | tinted CTA card backgrounds, icon chips |
| **Monitor — Amber** | `--saffron` | `#9C6B3F` | "Monitor" status only (distinct from primary) |
| Monitor soft | `--saffron-soft` | `#EBDCC6` | monitor pill bg, drift alert bg |
| **Stable — Sage** | `--sage` | `#6B7355` | "Stable" status, plant foliage |
| Sage deep / soft | `--sage-deep` / `--sage-soft` | `#555C42` / `#E1E4D6` | sage text / sage pill bg |
| **Flag — Jujube** | `--jujube` | `#8A3A3A` | "Discuss with GP" status, destructive |
| Jujube soft | `--jujube-soft` | `#ECD8D2` | flag pill bg |
| Accent — Plum | `--plum` / `--plum-soft` | `#6E5773` / `#E5DCE6` | rare accent (reserved) |
| Accent — Rose / Clay | `--rose` / `--clay` | `#B27E84` / `#B5532F` | reserved emphasis |

**Neutrals (warm paper, never pure grey):**

| Variable | Hex | Use |
|---|---|---|
| `--paper` | `#F7F3EC` | app canvas |
| `--paper-2` | `#FCFAF4` | raised surface, nav/header bars |
| `--paper-3` | `#FFFFFF` | highest cards |
| `--paper-sunk` | `#EFE8DB` | progress tracks, inset wells, empty grid cells |
| `--line` / `--line-soft` | `#E6DDCD` / `#EFE8DC` | hairline borders |
| `--ink` | `#2B2722` | primary text (warm near-black) |
| `--ink-2` | `#6B6256` | secondary text |
| `--ink-3` | `#9C9181` | captions |
| `--ink-4` | `#C3B8A4` | faint / placeholder |

### 2.2 Status mapping (replaces the old grid colors)

The plan's old colors (`#166534`, `#86efac`, `#f59e0b`, `#e5e7eb`) and the MVP's `scoreColor()`
HSL ramp are **retired**. Use:

| Status | Token | Activity-grid cell |
|---|---|---|
| Stable | `--sage` `#6B7355` | sage |
| Monitor | `--saffron` `#9C6B3F` | amber |
| Flag / drift | `--jujube` `#8A3A3A` | jujube |
| No session | `--paper-sunk` `#EFE8DB` | empty |

### 2.3 Typography

Two Google fonts. Load both (weights below).

| Family | Role | Weights | Notes |
|---|---|---|---|
| **Spectral** (serif) | headings, greetings, big numbers, the wordmark | 400/500/600 + italic | calm "apothecary" feel; italic used for the tagline & accents |
| **Hanken Grotesk** (sans) | all UI & body | 400/500/600/700 | humanist, highly legible; body ≥ 15px, tabular numerals for metrics |

Helper classes: `.serif-h` (Spectral 500, tight tracking), `.eyebrow` (11.5px, 700, uppercase,
0.16em tracking), `.tabnum` (tabular-nums).

### 2.4 Shape & depth

Radii `--r-sm/md/lg/xl` = 8 / 12 / 16 / 22px. Two shadows: `--shadow-card` (soft, on every card),
`--shadow-pop` (the hero browser frame only). Borders are 1px `--line`. Buttons are full-width,
~15px vertical padding, 12px radius.

---

## 3. Prototype file map

The prototype is plain React (via in-browser Babel) split for clarity. Each `*.jsx` exports its
components onto `window` at the bottom.

| File | Contains | What it's for |
|---|---|---|
| `index.html` | font links, script order, bundler thumbnail | entry; loads files in order: frame → dataviz → screens → app |
| `styles.css` | all design tokens + reusable classes | the system. Port these tokens first. |
| `frame.jsx` | `Ic` (icon set), `Mark`, `Panel`, `Nav`, `StatusPill`, `Body`, `Frame` | the side-panel chrome + shared primitives |
| `dataviz.jsx` | `genYear`, `ActivityGrid`, `Sparkline`, `GridLegend` | the history visualizations |
| `screens-home.jsx` | `Seal`, **`StreakPlant`**, `OnbWelcome`, `OnbName`, `HomeCalm` (+ unused `HomeWarm`/`HomeClinical`) | onboarding + the chosen Home |
| `screens-tests.jsx` | `Steps`, `TestsIntro`, `TypingTest`, `VoiceTest`, `EyeTest`, `TypingResult`, `SessionSummary` | the daily check-in flow |
| `screens-history.jsx` | `History`, `DriftHistory`, `ExportForm`, `ExportReady`, `Settings` | history, GP export, settings |
| `app.jsx` | `Hero`, `SystemStrip`, `Section`, `App` | the gallery/handoff page — **presentation only, not part of the product** |

> `app.jsx`, `Hero`, `SystemStrip`, `Section`, and the `Frame` wrapper exist only to display the
> screens side-by-side on the handoff page. Ignore them when porting. `HomeWarm` and `HomeClinical`
> are the two *unused* Home directions kept for reference — the chosen one is **`HomeCalm`**.

---

## 4. Component-by-component → your codebase

Mapping each prototype piece to the real extension. Current files were read from your repo;
target files follow the team plan in `.plan.md`.

### 4.1 Shared chrome & primitives (`frame.jsx`)

| Prototype | Does | Port to |
|---|---|---|
| `Mark` | the brand mark — a saffron sprig rising from a baseline (the "Baseline" pun) on a rounded saffron tile | a `Logo`/`Brand` component; replace the plain "B" tile in `App.tsx` `Header` |
| `Panel` + `.sp-bar` | mimics Chrome's side-panel header ("Baseline ⌄ … ✕"). **Prototype-only chrome** — the real extension already lives in a side panel, so you don't render this; just match the inner app styling | n/a (drop the sp-bar; keep the inner `.app` look) |
| `Nav` | bottom tab bar, 3 tabs **Home / Today / History**, active tab uses `--ginseng-wash` pill + `--ginseng-deep` icon/label | `components/BottomNav.tsx`; replace the current top-of-list teal `BottomNav` in `App.tsx`. Note the tab rename: Check-in → **Today** |
| `StatusPill` | `stable` / `monitor` / `flag` → colored dot + label ("Stable" / "Monitor" / "Discuss with GP") | a shared `<StatusPill status>`; reuse everywhere a status shows |
| `Ic` | line-icon set (home, tests, history, keyboard, mic, eye, check, arrow, shield, doc, bell, flame, leaf, sun, quiet, …) 1.6px stroke | your icon module / inline SVGs |
| `Body` | the scroll/padding wrapper inside a screen (22px sides) | the content container in each view |

**Tailwind/CSS note:** the prototype uses semantic classes + CSS vars rather than Tailwind
utilities. Easiest path in your Tailwind 4 setup: drop the tokens from §2 into `style.css` as
`@theme` variables (or `:root` vars) and reference them (`bg-[var(--paper)]`, or named theme
colors like `bg-paper`, `text-ink`, `bg-saffron`).

### 4.2 Onboarding (`OnbWelcome`, `OnbName`)

- `OnbWelcome` — brand `Seal`, wordmark in Spectral, italic tagline *"a clear line on how you're
  doing,"* a privacy line (shield + "Everything stays on this device"), primary **Get started**.
- `OnbName` — "Step 1 of 2", *"What should Baseline call you?"*, a single focused first-name input,
  **Continue →**.
- **Target:** `entrypoints/sidepanel/views/Onboarding.tsx` (new, per plan). Stores `firstName`.

### 4.3 Home — chosen direction (`HomeCalm`)

The product Home. `HomeCalm({ streak })` renders: date eyebrow → "Good morning, {name}" (Spectral)
→ **`StreakPlant`** centerpiece → streak count + `streakWord()` caption → `StatusPill` →
a tinted **"Begin today's check-in"** CTA card.

- **Target:** `views/Home.tsx`. Greeting from `user.firstName`; streak from
  `calculateStreak(sessions)`; status from latest session via `getOverallStatus`. The "readings
  holding steady" line was intentionally **removed** — the plant + status pill carry it.

#### `StreakPlant` — the signature piece (port carefully)

A parametric SVG plant whose size/fullness encodes the streak. Pure function of `streak`:

```
stemH   = 40 + min(streak,45)/45 * 78        // height grows, caps ~day 45
pairs   = clamp(2 + floor(streak/6), 2, 7)    // leaf count grows
crown   = streak >= 21 ? 5-petal saffron flower
        : streak >= 7  ? saffron bud
        :                two sprout leaves
```

- Stem is a gently curved path in `--sage-deep`; leaves are `leafPath()` quadratic shapes in
  `--sage`; the **flower/bud and the ground "baseline" line are `--ginseng` (saffron)** — tying the
  plant to the brand mark.
- `streakWord(streak)`: `<7` "just getting started" · `7–20` "your longest yet" · `21–44` "in full
  bloom" · `45+` "flourishing".
- **Target:** new `components/StreakPlant.tsx`. Keep it a pure `({ streak, size })` SVG component so
  it animates/re-renders cleanly when the streak ticks up after a session.

### 4.4 The daily check-in (`screens-tests.jsx`)

Sequence **Typing → Voice → Eye**, orchestrated by `Tests.tsx` (your `CheckinFlow.tsx` evolved).

| Prototype | Does | Port to |
|---|---|---|
| `Steps` | the 1·Typing › 2·Voice › 3·Eye progress pills (on/done/todo states) | shared progress header in `Tests.tsx` |
| `TestsIntro` | **now an environment-tips screen** (not a step list): "Two quick things first" → *Find good light* (sun) + *Somewhere quiet* (muted speaker) → **Begin** → privacy note | the intro state of `Tests.tsx` |
| `TypingTest` | sentence shown in Spectral with typed chars in `--ink` / untyped in `--ink-4`, a live caret, "Matching nicely" affirmation, char-count progress, footer *"we measure how you type — never what"* | `stations/TypingStation.tsx` |
| `VoiceTest` | mic ring with progress arc + live waveform bars + countdown; reassurance that nothing is recorded | `stations/VoiceStation.tsx` |
| `EyeTest` | "Look at the page behind" + a mock of the page with a saffron dot, "Dot 4 of 10" progress dots | `stations/EyeStation.tsx` (dots render via the content-script overlay) |
| `TypingResult` (+`SecRow`) | big primary metric (rhythm variance) + `StatusPill`, reassuring line, secondary metrics vs personal baseline | `components/ResultCard.tsx` |
| `SessionSummary` (+`SumRow`) | brand `Seal`, "All done for today", three per-test rows with status, streak +1, back-to-home | the summary state of `Tests.tsx` |

Copy tone throughout: encouraging, never diagnostic. The "Begin / Next" buttons are saffron primary.

### 4.5 History & export (`screens-history.jsx`)

| Prototype | Does | Port to |
|---|---|---|
| `History` (+`HistStat`, `TrendRow`) | streak/sessions/% stats row → **`ActivityGrid`** (GitHub-style year in herb tones) → `GridLegend` → three trend `Sparkline`s (typing/voice/eye) → "Export for GP appointment" | `views/History.tsx` |
| `ActivityGrid` (`dataviz.jsx`) | 52×7 weeks; cell color by status token; `genYear()` is just demo data — replace with real `sessions` | `components/ActivityGrid.tsx` (upgrade `Heatmap.tsx`) |
| `Sparkline` (`dataviz.jsx`) | tiny SVG line + soft area fill + end dot; `color` per metric (sage=stable, amber=monitor) | `components/Sparkline.tsx`; reuse in PDF export |
| `DriftHistory` | a **non-alarming** saffron-soft "gentle nudge" card + a 14-day sparkline — drift shown as amber, never red | `components/DriftAlert.tsx` surfaced in History/Home |
| `ExportForm` | patient name + optional DOB + a checklist of what the PDF contains → **Create PDF** | the export UI (your `DataCard` → dedicated view) feeding `lib/export.ts` |
| `ExportReady` | success state: sage check, generated file card, Done / Open | post-export state |

### 4.6 Settings (`Settings`, `ToggleRow`)

"Daily reminder", "Read instructions aloud", "Drift alerts" toggles (sage when on) → a sage
"Private by design" reassurance card → data controls (Export JSON, Delete all in jujube).
**Target:** `views/Settings.tsx` (you already have this file — re-skin it).

---

## 5. Concrete changes to the existing MVP

Things to rip out of the current `entrypoints/sidepanel/` code:

- **`App.tsx` `Header`** — remove `bg-gradient-to-r from-teal-600 to-emerald-500`. Use a calm
  `--paper-2` bar (or no header at all, since the side-panel chrome already labels it) with the new
  `Mark`.
- **`App.tsx` `BottomNav`** — swap `teal-50 / teal-700` active styles for `--ginseng-wash` /
  `--ginseng-deep`; rename "Check-in" → "Today"; add icons.
- **All `teal-*` / `emerald-*` / `slate-*` utilities** — map to the tokens in §2 (`teal` →
  saffron, `slate` text → `--ink*`, `slate-50` bg → `--paper`).
- **`scoreColor()` HSL ramp** (`App.tsx`) and the plan's grid hexes — delete; use the §2.2 status
  tokens.
- **`StepHeader` in `CheckinFlow.tsx`** — replace teal/emerald pills with the saffron/sage `Steps`
  styling.
- **Fonts** — `style.css` currently lists Inter; switch to **Spectral + Hanken Grotesk** and raise
  base body size.

### Drop-in token block (Tailwind 4 `style.css`)

```css
@import 'tailwindcss';

:root {
  /* neutrals */
  --paper:#F7F3EC; --paper-2:#FCFAF4; --paper-3:#FFFFFF; --paper-sunk:#EFE8DB;
  --line:#E6DDCD; --ink:#2B2722; --ink-2:#6B6256; --ink-3:#9C9181; --ink-4:#C3B8A4;
  /* primary = saffron (rename from the prototype's --ginseng) */
  --primary:#B8772B; --primary-deep:#95601E; --primary-soft:#EAD4AC; --primary-wash:#F7EFDD;
  /* status */
  --stable:#6B7355; --stable-soft:#E1E4D6;
  --monitor:#9C6B3F; --monitor-soft:#EBDCC6;
  --flag:#8A3A3A;    --flag-soft:#ECD8D2;
}

@theme {
  --color-paper:var(--paper); --color-ink:var(--ink);
  --color-saffron:var(--primary); --color-sage:var(--stable);
  --color-amber:var(--monitor); --color-jujube:var(--flag);
  --font-serif:'Spectral',Georgia,serif;
  --font-sans:'Hanken Grotesk',system-ui,sans-serif;
}
```

(Then `bg-saffron`, `text-ink`, `bg-paper`, `font-serif`, etc. become available as utilities.)

---

## 6. Accessibility & guardrails

- Body text ≥ 15px (≥18px where the spec demands), 44px+ touch targets.
- **Never red-alone for alarm.** Drift/flag uses amber + jujube *with* calm language.
- WCAG AA: saffron `#B8772B` carries cream/white text only at large/bold sizes (buttons, ≥17px);
  for small text on saffron use `--ink` or go deeper (`--primary-deep`).
- Keep the "provisional, not medical advice" / "stays on your device" reassurances visible.

---

*Prototype: `Baseline UI/index.html` — open it for the living reference (system swatches,
onboarding, the calm Home with the growing plant, the full check-in, history, export, settings).*
