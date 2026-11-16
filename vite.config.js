import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Each build gets an id: baked into the app (__APP_BUILD__) and written to /version.json, so an open app can
// notice a newer deploy and reload itself (src/app/appUpdate.js) — the iPhone home-screen app keeps old pages.
const BUILD_ID = new Date().toISOString();
const versionFile = {
  name: 'version-file',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) });
  },
};

export default defineConfig({
  plugins: [react(), versionFile],
  define: { __APP_BUILD__: JSON.stringify(BUILD_ID) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
