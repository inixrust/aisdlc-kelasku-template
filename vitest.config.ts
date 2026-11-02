import { defineConfig } from 'vitest/config';

// HP-1: semua test berjalan dengan zona proses UTC, apa pun zona mesin pengembang.
// Diset di sini (bukan `TZ=UTC vitest`) agar skrip `npm test` sama di Linux, macOS, dan Windows.
process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
