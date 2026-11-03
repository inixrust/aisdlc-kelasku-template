import { configDefaults, defineConfig } from 'vitest/config';

// HP-1: semua test berjalan dengan zona proses UTC, apa pun zona mesin pengembang.
// Diset di sini (bukan `TZ=UTC vitest`) agar skrip `npm test` sama di Linux, macOS, dan Windows.
process.env.TZ = 'UTC';

/**
 * Project Vitest (test-design-qa §Setup infrastruktur QA, AD-14):
 * - `unit`: fungsi murni dan pemeriksaan statis, tanpa DB dan tanpa server.
 * - `integration`: `data/`, `services/`, `http/`, skrip CLI, dan helper test; memakai berkas
 *   SQLite sementara yang nyata (jangan mock DB) dan `fastify.inject()`.
 * - `tz-utc`, `tz-jakarta`, `tz-jayapura`: berkas `*.tz.test.ts` di tiga zona proses (A-12).
 * `npm test` menjalankan semuanya; `npx vitest run --project <nama>` menjalankan satu.
 */
const UNIT_INCLUDE = [
  'src/*.test.ts',
  'src/shared/**/*.test.{ts,tsx}',
  'src/server/domain/**/*.test.ts',
  'src/client/**/*.test.{ts,tsx}',
];

/** A-12: test sensitif waktu (`*.tz.test.ts`) dijalankan sekali per zona proses berikut. */
const TZ_TEST = '**/*.tz.test.{ts,tsx}';
const TZ_PROJECTS = [
  ['tz-utc', 'UTC'],
  ['tz-jakarta', 'Asia/Jakarta'],
  ['tz-jayapura', 'Asia/Jayapura'],
] as const;

export default defineConfig({
  test: {
    environment: 'node',
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: UNIT_INCLUDE, exclude: [...configDefaults.exclude, TZ_TEST] },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/server/**/*.test.ts', 'scripts/**/*.test.ts', 'test/**/*.test.ts'],
          exclude: [...configDefaults.exclude, 'src/server/domain/**', TZ_TEST],
          // Addon native better-sqlite3 dan worker_threads lebih aman di proses terpisah.
          pool: 'forks',
        },
      },
      ...TZ_PROJECTS.map(([name, timeZone]) => ({
        extends: true,
        // `env.TZ` diterapkan ke `process.env` worker; Node membaca ulang zona saat TZ berubah.
        test: { name, include: [TZ_TEST], env: { TZ: timeZone } },
      })),
    ],
  },
});
