/**
 * ATDD fase merah Story 1.7 — P0 konkurensi R1 dan R2 (test-design-epic-1 §P0).
 * - AC-5  (1.7-INT-001, P0-001): 20 pendaftaran serentak lewat worker → tepat 5 Terdaftar, 15 Daftar tunggu; ×50.
 * - AC-6  (1.7-API-001, A-11):   20 POST serentak lewat HTTP nyata `startTestServer()` → semua 200; ×50.
 * - AC-7  (1.7-INT-001 bagian mutation check): mutan non-atomik harus tertangkap ≥ 1× dalam 50 ulangan.
 * - AC-9  (1.7-INT-003 + 1.7-API-002, P0-002): dua pendaftaran identik serentak → satu baris aktif; ×50 worker + ×50 HTTP.
 * - AC-10 (1.7-INT-003 bagian mutation check): tanpa cek aktif di transaksi + tanpa unique index parsial → tertangkap.
 * Risiko: R-001, R-002, R-008, R-020, R-028.
 *
 * FASE MERAH: test R1–R7 tidak boleh `.skip` (test/README.md, test-design-epic-1 §Aturan scaffold), jadi
 * dipasang sebagai `it.fails`: dijalankan di setiap `npm test` dan suite tetap hijau selama perilakunya
 * belum ada. Begitu use-case benar, `it.fails` berubah MERAH. Saat itu ganti `it.fails` → `it`.
 */
import { afterAll, describe, expect, it } from 'vitest';
import {
  CONCURRENCY_REPEATS,
  repeatConcurrent,
  runConcurrently,
  stopConcurrencyWorkers,
} from '../../../test/helpers/concurrency.js';
import {
  activeCount,
  givenClass,
  givenClassInFile,
  oneTo,
  statusCounts,
} from '../../../test/helpers/registrations.js';
import { createTestDb } from '../../../test/helpers/test-db.js';
import { startTestServer } from '../../../test/helpers/test-server.js';
import { registerAtomic, registerNonAtomic } from '../../../test/tasks/registration-tasks.js';
import type { Db } from '../data/db.js';
import { createDb } from '../data/db.js';

const WORKERS = 20;
const QUOTA = 5;
const SCENARIO_TIMEOUT_MS = 300_000;

/** Dua email yang sama setelah `normalizeEmail` (AC R2 epics). */
const DUPLICATE_EMAILS = ['Budi@Mail.com ', 'budi@mail.com'] as const;
const DUPLICATE_NAME = 'Budi Santoso';

afterAll(async () => {
  await stopConcurrencyWorkers();
});

function participant(index: number): { name: string; email: string } {
  return { name: `Peserta ${index + 1}`, email: `peserta-${index + 1}@contoh.id` };
}

function waitlistPositions(outcomes: Array<{ status: string; waitlistPosition?: number | null }>): number[] {
  return outcomes
    .filter((o) => o.status === 'waitlisted')
    .map((o) => o.waitlistPosition ?? Number.NaN)
    .sort((a, b) => a - b);
}

/** Membuang unique index pada `registrations` (bagian mutan R2). Mengembalikan jumlah index yang dibuang. */
function dropUniqueIndexesOnRegistrations(db: Db): number {
  const indexes = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'registrations' AND sql LIKE '%UNIQUE%'")
    .all() as { name: string }[];
  for (const { name } of indexes) db.exec(`DROP INDEX "${name.replaceAll('"', '""')}"`);
  return indexes.length;
}

interface HttpRegistration {
  httpStatus: number;
  body: { status: string; waitlistPosition?: number; alreadyActive: boolean; error?: { code: string } };
}

async function postRegistration(baseUrl: string, publicCode: string, input: { name: string; email: string }): Promise<HttpRegistration> {
  const response = await fetch(`${baseUrl}/api/public/classes/${publicCode}/registrations`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  return { httpStatus: response.status, body: (await response.json()) as HttpRegistration['body'] };
}

describe('R1: quota is never exceeded under concurrent registrations (FR8, AD-3, AD-5)', () => {
  it.fails(
    '[P0] AC-5 R1: 20 parallel registrations to a quota-5 class yield exactly 5 registered',
    async () => {
      await repeatConcurrent(CONCURRENCY_REPEATS, async () => {
        const testDb = createTestDb();
        try {
          const cls = givenClass(testDb.db, { quota: QUOTA });
          const results = await runConcurrently(WORKERS, registerAtomic, {
            dbPath: testDb.dbPath,
            input: (i) => ({ publicCode: cls.publicCode, ...participant(i) }),
          });
          const outcomes = results.flatMap((r) => (r.ok ? [r.value] : []));

          // Kriteria inti.
          expect(outcomes.filter((o) => o.status === 'registered')).toHaveLength(QUOTA);

          expect(results.filter((r) => !r.ok)).toEqual([]);
          expect(waitlistPositions(outcomes)).toEqual(oneTo(WORKERS - QUOTA));
          expect(outcomes.every((o) => !o.alreadyActive)).toBe(true);
          expect(statusCounts(testDb.db, cls.id)).toEqual({ registered: QUOTA, waitlisted: WORKERS - QUOTA, cancelled: 0 });
        } finally {
          testDb.cleanup();
        }
      });
    },
    SCENARIO_TIMEOUT_MS,
  );

  it.fails(
    '[P0] AC-6 R1: 20 concurrent HTTP registrations all succeed without 5xx and fill the quota exactly',
    async () => {
      const server = await startTestServer();
      const readDb = createDb(server.dbPath);
      try {
        await repeatConcurrent(CONCURRENCY_REPEATS, async () => {
          const cls = givenClassInFile(server.dbPath, { quota: QUOTA });
          const responses = await Promise.all(
            Array.from({ length: WORKERS }, (_, i) => postRegistration(server.baseUrl, cls.publicCode, participant(i))),
          );

          // Kriteria inti: tidak ada 5xx (termasuk 503 database_busy) maupun 4xx.
          expect(responses.map((r) => r.httpStatus)).toEqual(Array.from({ length: WORKERS }, () => 200));

          const bodies = responses.map((r) => r.body);
          expect(bodies.filter((b) => b.status === 'registered')).toHaveLength(QUOTA);
          expect(waitlistPositions(bodies)).toEqual(oneTo(WORKERS - QUOTA));
          expect(statusCounts(readDb, cls.id)).toEqual({ registered: QUOTA, waitlisted: WORKERS - QUOTA, cancelled: 0 });
        });
      } finally {
        readDb.close();
        await server.close();
      }
    },
    SCENARIO_TIMEOUT_MS,
  );

  it.fails(
    '[P0] AC-7 R1: mutation check — non-atomic quota check is caught by the concurrency test',
    async () => {
      let detectedAt: number | null = null;
      let maxRegistered = 0;
      for (let repetition = 1; repetition <= CONCURRENCY_REPEATS && detectedAt === null; repetition++) {
        const testDb = createTestDb();
        try {
          const cls = givenClass(testDb.db, { quota: QUOTA });
          await runConcurrently(WORKERS, registerNonAtomic, {
            dbPath: testDb.dbPath,
            input: (i) => ({ publicCode: cls.publicCode, ...participant(i) }),
          });
          // Asersi R1 yang sama dengan AC-5: Terdaftar tidak boleh melebihi kuota.
          const { registered } = statusCounts(testDb.db, cls.id);
          maxRegistered = Math.max(maxRegistered, registered);
          if (registered > QUOTA) detectedAt = repetition;
        } finally {
          testDb.cleanup();
        }
      }

      // Kriteria inti: bila gagal, test AC-5 tidak cukup tajam untuk menangkap cek kuota di luar transaksi.
      expect(detectedAt, `Terdaftar maksimum ${maxRegistered} dalam ${CONCURRENCY_REPEATS} ulangan mutan`).not.toBeNull();
    },
    SCENARIO_TIMEOUT_MS,
  );
});

describe('R2: one active registration per email per class under concurrency (FR9, AD-5)', () => {
  it.fails(
    '[P0] AC-9 R2: concurrent duplicate registrations create one row',
    async () => {
      // Bagian 1 — worker_threads, koneksi terpisah.
      await repeatConcurrent(CONCURRENCY_REPEATS, async () => {
        const testDb = createTestDb();
        try {
          const cls = givenClass(testDb.db, { quota: QUOTA });
          const results = await runConcurrently(2, registerAtomic, {
            dbPath: testDb.dbPath,
            input: (i) => ({ publicCode: cls.publicCode, name: DUPLICATE_NAME, email: DUPLICATE_EMAILS[i] ?? '' }),
          });

          // Kriteria inti.
          expect(activeCount(testDb.db, cls.id)).toBe(1);

          expect(results.filter((r) => !r.ok)).toEqual([]);
          const outcomes = results.flatMap((r) => (r.ok ? [r.value] : []));
          expect(new Set(outcomes.map((o) => o.status)).size).toBe(1);
          expect(outcomes.map((o) => o.alreadyActive).sort()).toEqual([false, true]);
        } finally {
          testDb.cleanup();
        }
      });

      // Bagian 2 — HTTP nyata: SQLITE_CONSTRAINT_UNIQUE (bila terjadi) dipetakan ke 200 alreadyActive, bukan 5xx.
      const server = await startTestServer();
      const readDb = createDb(server.dbPath);
      try {
        await repeatConcurrent(CONCURRENCY_REPEATS, async () => {
          const cls = givenClassInFile(server.dbPath, { quota: QUOTA });
          const responses = await Promise.all(
            DUPLICATE_EMAILS.map((email) => postRegistration(server.baseUrl, cls.publicCode, { name: DUPLICATE_NAME, email })),
          );
          expect(activeCount(readDb, cls.id)).toBe(1);
          expect(responses.map((r) => r.httpStatus)).toEqual([200, 200]);
          expect(new Set(responses.map((r) => r.body.status)).size).toBe(1);
          expect(responses.map((r) => r.body.alreadyActive).sort()).toEqual([false, true]);
        });
      } finally {
        readDb.close();
        await server.close();
      }
    },
    SCENARIO_TIMEOUT_MS,
  );

  it.fails(
    '[P0] AC-10 R2: mutation check — removing the in-transaction check and partial unique index is caught',
    async () => {
      let detectedAt: number | null = null;
      let droppedIndexes = 0;
      for (let repetition = 1; repetition <= CONCURRENCY_REPEATS && detectedAt === null; repetition++) {
        const testDb = createTestDb();
        try {
          const cls = givenClass(testDb.db, { quota: QUOTA });
          droppedIndexes = Math.max(droppedIndexes, dropUniqueIndexesOnRegistrations(testDb.db));
          await runConcurrently(2, registerNonAtomic, {
            dbPath: testDb.dbPath,
            input: (i) => ({ publicCode: cls.publicCode, name: DUPLICATE_NAME, email: DUPLICATE_EMAILS[i] ?? '' }),
          });
          // Asersi R2 yang sama dengan AC-9: satu baris aktif.
          if (activeCount(testDb.db, cls.id) > 1) detectedAt = repetition;
        } finally {
          testDb.cleanup();
        }
      }

      // Kriteria inti.
      expect(detectedAt, `mutan R2 tidak pernah membuat baris aktif ganda dalam ${CONCURRENCY_REPEATS} ulangan`).not.toBeNull();
      // Mutan bermakna hanya bila unique index parsial memang ada lalu dibuang.
      expect(droppedIndexes).toBeGreaterThan(0);
    },
    SCENARIO_TIMEOUT_MS,
  );
});
