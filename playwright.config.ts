import { defineConfig, devices } from '@playwright/test';

const PORT = 4310;

// AD-14: e2e berjalan atas build produksi dengan NODE_ENV=test dan zona browser UTC (HP-1).
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    timezoneId: 'UTC',
    locale: 'id-ID',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && node dist/server/main.js',
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: 'test',
      PORT: String(PORT),
      KELASKU_FAKE_NOW: '2026-11-09T03:00:00.000Z',
    },
  },
});
