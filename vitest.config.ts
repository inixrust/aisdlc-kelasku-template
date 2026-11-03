import { configDefaults, defineConfig } from 'vitest/config';

// HP-1: semua test berjalan dengan zona proses UTC, apa pun zona mesin pengembang.
// Diset di sini (bukan `TZ=UTC vitest`) agar skrip `npm test` sama di Linux, macOS, dan Windows.
process.env.TZ = 'UTC';

/**
 * Dua project (test-design-qa §Setup infrastruktur QA, AD-14):
 * - `unit`: fungsi murni dan pemeriksaan statis, tanpa DB dan tanpa server.
 * - `integration`: `data/`, `services/`, `http/`, skrip CLI, dan helper test; memakai berkas
 *   SQLite sementara yang nyata (jangan mock DB) dan `fastify.inject()`.
 * `npm test` menjalankan keduanya; `npx vitest run --project <nama>` menjalankan satu.
 */
const UNIT_INCLUDE = [
  'src/*.test.ts',
  'src/shared/**/*.test.{ts,tsx}',
  'src/server/domain/**/*.test.ts',
  'src/client/**/*.test.{ts,tsx}',
];

export default defineConfig({
  test: {
    environment: 'node',
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: UNIT_INCLUDE },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/server/**/*.test.ts', 'scripts/**/*.test.ts', 'test/**/*.test.ts'],
          exclude: [...configDefaults.exclude, 'src/server/domain/**'],
          // Addon native better-sqlite3 dan worker_threads lebih aman di proses terpisah.
          pool: 'forks',
        },
      },
    ],
  },
});
