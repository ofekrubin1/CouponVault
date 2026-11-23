import { defineConfig, devices } from '@playwright/test';

// End-to-end tests against the Firebase emulators (run via `npm run test:e2e`).
// Two real browser engines: WebKit as an iPhone (Safari's engine) and Chromium as an Android phone.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: 4,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'test-results/html' }]],
  outputDir: 'test-results/artifacts',
  use: {
    baseURL: 'http://127.0.0.1:5180',
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    trace: 'retain-on-failure',
    // SHOW=1: a screenshot and a video of every test in the HTML report (to watch what the tests do)
    screenshot: process.env.SHOW ? 'on' : 'only-on-failure',
    video: process.env.SHOW ? 'on' : 'off',
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
    { name: 'android', use: { ...devices['Pixel 7'] } },
  ],
  // A production build (what ships), pointed at the emulators. Explicit IPv4: on Windows "localhost"
  // may bind only to ::1.
  webServer: {
    command:
      'npx vite build --mode emulator --outDir dist-emu --emptyOutDir && npx vite preview --mode emulator --outDir dist-emu --host 127.0.0.1 --port 5180 --strictPort',
    url: 'http://127.0.0.1:5180',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
