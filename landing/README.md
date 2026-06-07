# Baseline — landing page

Marketing + install page for the Baseline extension, built with Next.js (App Router) and
the same design tokens/fonts as the extension. Deployed on Vercel.

## Develop

```bash
cd landing
npm install
npm run dev      # http://localhost:3001
```

## Deploy (Vercel)

1. Create a Vercel project from this repo and set **Root Directory = `landing`**.
2. Build command `next build`, output handled by Vercel's Next.js preset.
3. Once the Chrome Web Store listing is live (issue #40), add an env var
   `NEXT_PUBLIC_STORE_URL` = the store URL. The install CTA then becomes an
   “Add to Chrome” button automatically; until then it shows the load-unpacked steps.

## Design parity

`app/globals.css` copies the `:root` token block from
`../entrypoints/sidepanel/style.css` (saffron/paper palette) and reuses the bundled
Spectral + Hanken Grotesk fonts via `@fontsource`.
