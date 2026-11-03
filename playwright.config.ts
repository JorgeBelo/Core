import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/ui',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'node scripts/serve-web.mjs --dir work/e2e-web --port 4173',
    port: 4173,
    reuseExistingServer: false,
  },
  timeout: 30000,
});
