/**
 * ATDD Story 1.7 — AC-14 (1.7-API-005 bagian batas waktu, P1-018). Risiko: R-005, R-022.
 * Pendaftaran tutup pukul 00.00 WIB pada tanggal sesi terakhir (`max(session_date) <= today`, AD-6/AD-7).
 * Berkas `*.tz.test.ts`: dijalankan di zona proses UTC, Asia/Jakarta, dan Asia/Jayapura dengan ekspektasi sama.
 *
 * Setiap instan memakai app + services dengan clock beku sendiri di atas berkas DB yang sama.
 * Fase hijau: diaktifkan oleh Story 1.7 (hapus `.skip`).
 */
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { givenClass } from '../../../test/helpers/registrations.js';
import { createTempDir, type TempDir } from '../../../test/helpers/temp-dir.js';
import { createTestDb, fixedClock, type TestDb } from '../../../test/helpers/test-db.js';
import { uniqueEmail } from '../../../test/helpers/unique.js';
import { createServices } from '../services/index.js';
import { buildApp } from './app.js';

/** 23.59 WIB Senin 9 Nov 2026: sehari sebelum sesi terakhir → masih dibuka. */
const LAST_MINUTE_OPEN = '2026-11-09T16:59:00.000Z';
/** 00.00 WIB Selasa 10 Nov 2026: tanggal sesi terakhir dimulai → tertutup. */
const MIDNIGHT_CLOSED = '2026-11-09T17:00:00.000Z';
/** 23.30 WIB Selasa 10 Nov 2026: masih tanggal sesi terakhir → tertutup. */
const LAST_DAY_CLOSED = '2026-11-10T16:30:00.000Z';

let testDb: TestDb;
let clientDir: TempDir;
let publicCode: string;
const apps: FastifyInstance[] = [];

beforeAll(() => {
  testDb = createTestDb();
  clientDir = createTempDir('kelasku-client-');
  publicCode = givenClass(testDb.db, { nowIso: '2026-11-05T03:00:00.000Z', sessionDates: ['2026-11-06', '2026-11-10'] }).publicCode;
});

afterAll(async () => {
  await Promise.all(apps.map((app) => app.close()));
  clientDir.cleanup();
  testDb.cleanup();
});

async function registerAt(nowIso: string): Promise<LightMyRequestResponse> {
  const app = await buildApp({ services: createServices({ db: testDb.db, clock: fixedClock(nowIso) }), clientDir: clientDir.path });
  apps.push(app);
  return app.inject({
    method: 'POST',
    url: `/api/public/classes/${publicCode}/registrations`,
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({ name: 'Fajar Nugroho', email: uniqueEmail('fajar') }),
  });
}

describe('registration closing time (FR7, AD-7)', () => {
  it('[P1] AC-14 FR7: registration closes at 00.00 WIB on the last session date', async () => {
    const atMidnight = await registerAt(MIDNIGHT_CLOSED);

    // Kriteria inti.
    expect(atMidnight.statusCode).toBe(409);

    expect((atMidnight.json() as { error?: { code: string } }).error?.code).toBe('registration_closed');
    expect((await registerAt(LAST_DAY_CLOSED)).statusCode).toBe(409);
    const lastMinute = await registerAt(LAST_MINUTE_OPEN);
    expect(lastMinute.statusCode).toBe(200);
    expect((lastMinute.json() as { status: string }).status).toBe('registered');
  });

  // Automate Story 1.7 — cabang sekunder ATDD AC-3: klien memakai `today` dari respons, jadi nilainya ikut bergeser.
  it('[P2] AC-3 FR7: the public class reports today and status in WIB, flipping to finished at 00.00 WIB on the last session date', async () => {
    const at = async (nowIso: string) => {
      const app = await buildApp({ services: createServices({ db: testDb.db, clock: fixedClock(nowIso) }), clientDir: clientDir.path });
      apps.push(app);
      return (await app.inject({ method: 'GET', url: `/api/public/classes/${publicCode}` })).json() as { status: string; today: string };
    };

    expect(await at(LAST_MINUTE_OPEN)).toMatchObject({ today: '2026-11-09', status: 'open' });
    expect(await at(MIDNIGHT_CLOSED)).toMatchObject({ today: '2026-11-10', status: 'finished' });
    expect(await at(LAST_DAY_CLOSED)).toMatchObject({ today: '2026-11-10', status: 'finished' });
  });
});
