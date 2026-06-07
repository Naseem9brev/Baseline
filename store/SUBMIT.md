# Submitting Baseline to the Chrome Web Store

Everything you need is in this folder. The steps below are the parts only you can do
(they need your Google account and the one-time fee). Estimated time: ~30–45 min, plus
Google's review (usually a few days).

## 0. Prerequisites
- A Google account.
- The packaged extension: run `npm run zip` at the repo root → produces
  `.output/baseline-<version>-chrome.zip`. (Re-run after any code change so the upload
  matches `main`.)
- The privacy policy hosted at a public URL. Easiest: deploy the landing page (issue #37)
  to Vercel — the policy is served at `https://<your-domain>/privacy`. (`store/PRIVACY.md`
  is the same text if you prefer to host it elsewhere, e.g. a GitHub Pages/Gist URL.)
- Screenshots + icon per the checklist in `store/LISTING.md`.

## 1. Create a developer account (one-time, $5)
1. Go to the Chrome Web Store Developer Dashboard: https://chrome.google.com/webstore/devconsole
2. Sign in and pay the one-time **$5** registration fee.
3. Complete the account/publisher details (a verified contact email is required).

## 2. Create the item & upload
1. In the dashboard, click **Add new item**.
2. Upload `.output/baseline-<version>-chrome.zip`.
3. Wait for the package to process.

## 3. Fill in the Store listing tab
Use the copy in `store/LISTING.md`:
- Name, Summary, Detailed description.
- Category: **Health & Fitness**. Language: English.
- Upload the store icon (128×128) and 1–5 screenshots (1280×800). Optional promo tiles.

## 4. Fill in Privacy practices tab
- **Single purpose:** "A private daily on-device health check-in (eyes, voice, reaction) with trend tracking and export."
- **Permission justifications:** copy the table from `store/LISTING.md` (one line per permission + each host permission).
- **Remote code:** No.
- **Data usage:** declare that the extension does **not** collect/transmit data by default; optional API features send only numeric metrics (or pixelated frames for VitalLens) to the user's chosen provider; no selling, no ads. Tick the developer certifications.
- **Privacy policy URL:** paste your hosted `/privacy` URL.

## 5. Distribution
- Visibility: **Public** (or Unlisted if you want a soft launch).
- Regions: all (or your choice).

## 6. Submit for review
- Click **Submit for review**. Status shows "Pending review".
- You'll get an email when it's published or if changes are requested.

## 7. After approval — wire up the landing page
1. Copy the published listing URL (looks like
   `https://chromewebstore.google.com/detail/<id>`).
2. In the Vercel project for `landing/`, set env var
   `NEXT_PUBLIC_STORE_URL=<that URL>` and redeploy. The install CTA becomes an
   "Add to Chrome" button automatically.
3. Update the root `README.md` "Add to Chrome" section with the store link.

## Notes
- Bump `version` in the manifest (via `package.json` / `wxt.config.ts`) for each new
  upload; the store rejects re-uploads with the same version.
- Keep `store/PRIVACY.md`, the hosted `/privacy` page, and the listing's data disclosures
  consistent — mismatches are a common review rejection.
