import { afterAll, describe, expect, it } from 'vitest';
import type { Db } from '../../src/server/data/db.js';
import {
  CONCURRENCY_REPEATS,
  MAIN_THREAD_ID,
  repeatConcurrent,
  runConcurrently,
  stopConcurrencyWorkers,
} from './concurrency.js';
import {
  alwaysFails,
  BOUNDED_ITEMS_LIMIT,
  BOUNDED_ITEMS_MIGRATIONS_DIR,
  checkInsideWriteTx,
  checkOutsideTx,
} from './fixtures/bounded-items-tasks.js';
import { createTestDb } from './test-db.js';
import { startTestServer } from './test-server.js';

const WORKERS = 20;
const SCENARIO_TIMEOUT_MS = 120_000;

afterAll(async () => {
  await stopConcurrencyWorkers();
});

function countRows(db: Db): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM bounded_items').get() as { n: number }).n;
}

describe('concurrency harness (AD-14, NFR-1)', () => {
  it(
    'negative control: a check outside the write transaction exceeds the bound at least once',
    async () => {
      let detectedAt: number | null = null;
      let maxRows = 0;
      for (let repetition = 1; repetition <= CONCURRENCY_REPEATS && detectedAt === null; repetition++) {
        const testDb = createTestDb({ migrationsDir: BOUNDED_ITEMS_MIGRATIONS_DIR });
        try {
          await runConcurrently(WORKERS, checkOutsideTx, { dbPath: testDb.dbPath });
          const rows = countRows(testDb.db);
          maxRows = Math.max(maxRows, rows);
          if (rows > BOUNDED_ITEMS_LIMIT) detectedAt = repetition;
        } finally {
          testDb.cleanup();
        }
      }
      // Bila gagal: harness tidak menghasilkan konkurensi nyata (mis. worker berjalan serial).
      expect(detectedAt, `jumlah baris maksimum ${maxRows} dalam ${CONCURRENCY_REPEATS} ulangan`).not.toBeNull();
    },
    SCENARIO_TIMEOUT_MS,
  );

  it(
    `positive control: withWriteTx keeps exactly ${BOUNDED_ITEMS_LIMIT} rows in each of ${CONCURRENCY_REPEATS} repetitions`,
    async () => {
      await repeatConcurrent(CONCURRENCY_REPEATS, async () => {
        const testDb = createTestDb({ migrationsDir: BOUNDED_ITEMS_MIGRATIONS_DIR });
        try {
          const results = await runConcurrently(WORKERS, checkInsideWriteTx, { dbPath: testDb.dbPath });
          expect(results.filter((r) => !r.ok)).toEqual([]);
          expect(results.filter((r) => r.ok && r.value.inserted)).toHaveLength(BOUNDED_ITEMS_LIMIT);
          expect(countRows(testDb.db)).toBe(BOUNDED_ITEMS_LIMIT);
        } finally {
          testDb.cleanup();
        }
      });
    },
    SCENARIO_TIMEOUT_MS,
  );

  it('runs every task on its own worker thread and connection, results ordered by index', async () => {
    const testDb = createTestDb({ migrationsDir: BOUNDED_ITEMS_MIGRATIONS_DIR });
    try {
      const results = await runConcurrently(WORKERS, checkInsideWriteTx, { dbPath: testDb.dbPath });
      expect(results.map((r) => r.index)).toEqual(Array.from({ length: WORKERS }, (_, i) => i));
      const threads = new Set(results.map((r) => r.threadId));
      expect(threads.size).toBe(WORKERS);
      expect(threads.has(MAIN_THREAD_ID)).toBe(false);
    } finally {
      testDb.cleanup();
    }
  });

  it('reports task errors per worker with their code instead of throwing', async () => {
    const testDb = createTestDb({ migrationsDir: BOUNDED_ITEMS_MIGRATIONS_DIR });
    try {
      const results = await runConcurrently(3, alwaysFails, { dbPath: testDb.dbPath });
      expect(results).toEqual([0, 1, 2].map((index) => expect.objectContaining({
        ok: false,
        code: 'fixture_failure',
        message: `gagal di worker ${index}`,
        index,
      })));
    } finally {
      testDb.cleanup();
    }
  });

  it('repeatConcurrent names the failing repetition and keeps the cause', async () => {
    const cause = new Error('jumlah Terdaftar 6');
    const seen: number[] = [];
    const run = repeatConcurrent(5, (repetition) => {
      seen.push(repetition);
      if (repetition === 3) throw cause;
      return repetition;
    });
    await expect(run).rejects.toThrow('ulangan 3 dari 5');
    await expect(run).rejects.toMatchObject({ cause });
    expect(seen).toEqual([1, 2, 3]);
    await expect(repeatConcurrent(2, (repetition) => repetition * 10)).resolves.toEqual([10, 20]);
  });

  it('startTestServer collects every status of 20 simultaneous fetches (404 envelope for unknown /api/*)', async () => {
    const server = await startTestServer();
    try {
      const responses = await Promise.all(
        Array.from({ length: WORKERS }, (_, i) => fetch(`${server.baseUrl}/api/tidak-ada-${i}`, { method: 'POST' })),
      );
      const bodies = await Promise.all(responses.map((r) => r.json()));
      expect(responses.map((r) => r.status)).toEqual(Array.from({ length: WORKERS }, () => 404));
      for (const body of bodies) {
        expect(body).toEqual({ error: { code: 'not_found', message: 'Halaman atau data tidak ditemukan.' } });
      }
      expect(server.dbPath).toMatch(/kelasku\.db$/);
    } finally {
      await server.close();
    }
  });
});
