import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 2,
  timeout: 30000,
  use: { channel: process.env.CI ? undefined : 'chrome', baseURL: 'http://127.0.0.1:5178', viewport: { width: 1600, height: 1100 } },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5178 --strictPort', url: 'http://127.0.0.1:5178', reuseExistingServer: false },
});
