// When the Chrome Web Store listing is live (issue #40), set
// NEXT_PUBLIC_STORE_URL in the Vercel project env. Empty → the install CTA
// shows the manual "load unpacked" steps instead of an "Add to Chrome" button.
export const STORE_URL = process.env.NEXT_PUBLIC_STORE_URL?.trim() || '';
export const REPO_URL = 'https://github.com/Naseem9brev/Baseline';
