import { defineConfig, devices } from '@playwright/test';

const PORT = 4310;
const CI = Boolean(process.env.CI);

// AD-14: e2e berjalan atas build produksi dengan NODE_ENV=test dan zona browser UTC (HP-1).
// Tidak ada BASE_URL eksternal: e2e hanya bermakna di server sendiri dengan clock palsu.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: CI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    timezoneId: 'UTC',
    locale: 'id-ID',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure-and-retries',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // Admin memakai laptop, peserta memakai ponsel (NFR-4). Setiap spec berjalan di keduanya.
  projects: [
    {
      name: 'admin-desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'participant-mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } },
    },
  ],
  webServer: {
    // TODO(story seed:demo, B-2): hapus DB e2e lalu `npm run seed:demo` sebelum start,
    // dengan DATABASE_PATH khusus e2e. Server belum membuka DB di story 1.1.
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
