import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// WXT config: https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
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
