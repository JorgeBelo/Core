import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/offline-ui',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4176',
    trace: 'retain-on-failure',
    timezoneId: 'America/Sao_Paulo',
    channel: 'chrome',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'node scripts/serve-web.mjs --dir apps/offline/dist --port 4176',
    port: 4176,
    reuseExistingServer: true,
  },
});
