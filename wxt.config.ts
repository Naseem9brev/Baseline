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
  manifest: ({ mode }) => ({
    name: 'Baseline',
    description: 'Your daily health baseline — a quick on-device check-in.',
    ...(mode === 'development'
      ? {
          content_security_policy: {
            extension_pages:
              "script-src 'self' 'wasm-unsafe-eval' http://localhost:3000; " +
              "connect-src 'self' http://localhost:3000 ws://localhost:3000 https://api.elevenlabs.io https://api.z.ai https://api.rouast.com https://generativelanguage.googleapis.com; " +
              "object-src 'self';",
          },
        }
      : {}),
    // NOTE: camera/mic are NOT permissions — getUserMedia prompts directly in the
    // chrome-extension:// side panel (a secure context).
    permissions: ['storage', 'alarms', 'notifications', 'sidePanel', 'downloads', 'tabs'],
    host_permissions: [
      'https://api.elevenlabs.io/*',
      'https://api.z.ai/*',
      'https://api.rouast.com/*',
      'https://generativelanguage.googleapis.com/*',
    ],
    // An empty action gives us a toolbar icon; background opens the side panel on click.
    action: {},
  }),
  vite: () => ({
    plugins: [tailwindcss()],
    assetsInclude: ['**/*.wasm'],
    worker: {
      format: 'es',
    },
  }),
});
