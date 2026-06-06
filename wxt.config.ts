import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// WXT config: https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  // Pin dev port so manifest CSP and sidepanel.html stay in sync (avoids blank panel).
  dev: {
    server: {
      port: 3000,
      strictPort: true,
    },
  },
  manifest: {
    name: 'Baseline',
    description: 'Your daily health baseline — a quick on-device check-in.',
    // NOTE: camera/mic are NOT permissions — getUserMedia prompts directly in the
    // chrome-extension:// side panel (a secure context).
    permissions: ['storage', 'alarms', 'notifications', 'sidePanel', 'downloads', 'tabs'],
    // An empty action gives us a toolbar icon; background opens the side panel on click.
    action: {},
  },
  vite: () => ({
    plugins: [tailwindcss()],
    assetsInclude: ['**/*.wasm'],
    worker: {
      format: 'es',
    },
  }),
});
