/**
 * ATDD Story 1.7 — R3 di level use-case (berkas SQLite sementara nyata).
 * - AC-11 (1.7-INT-005, P1-013): pendaftar baru masuk ekor antrean selama antrean tidak kosong, walau ada kursi.
 * - AC-12 (1.7-INT-006, P1-014): FIFO menurut waktu daftar; `created_at` identik (clock beku) → `id` penentu.
 * Risiko: R-004.
 *
 * State "kursi kosong + antrean tidak kosong" tidak bisa dibuat lewat use-case Epik 1 (pembatalan baru ada di
 * Epik 2), jadi AC-11 membatalkan satu baris lewat SQL mentah sebagai fixture state tak sah (test-design
 * §Prasyarat). Ini satu-satunya tulis langsung ke `registrations` di luar `registrations-repo.ts`, dan hanya di test.
 *
 * Fase hijau: diaktifkan oleh Story 1.7 (`it.fails` → `it`).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { givenClass, type RegistrationResult, registrationsOf, statusCounts } from '../../../test/helpers/registrations.js';
import { createTestDb, fixedClock, TEST_NOW_ISO, type TestDb } from '../../../test/helpers/test-db.js';
import { uniqueEmail } from '../../../test/helpers/unique.js';
import { createServices } from './index.js';

let testDb: TestDb;

beforeAll(() => {
  testDb = createTestDb();
});

afterAll(() => testDb.cleanup());

function person(label: string): { name: string; email: string } {
  return { name: `Peserta ${label}`, email: uniqueEmail(label) };
}

describe('R3: waitlist order (FR10, AD-5, AD-15)', () => {
  it('[P1] AC-11 R3: a new registration is waitlisted while the waitlist is non-empty', async () => {
    const cls = givenClass(testDb.db, { quota: 2 });
    const [a, b, c, d] = [person('a'), person('b'), person('c'), person('d')];
    await registrationsOf(testDb.services).register(cls.publicCode, a);
    await registrationsOf(testDb.services).register(cls.publicCode, b);
    await registrationsOf(testDb.services).register(cls.publicCode, c);
    // Fixture state tak sah: A batal tanpa promosi → Terdaftar 1 < kuota 2, antrean [C].
    testDb.db
      .prepare(
        "UPDATE registrations SET status = 'cancelled', cancelled_at = ?, cancelled_by = 'admin' WHERE class_id = ? AND email = ? AND status = 'registered'",
      )
      .run(TEST_NOW_ISO, cls.id, a.email);

    const result = await registrationsOf(testDb.services).register(cls.publicCode, d);

    // Kriteria inti.
    expect(result.status).toBe('waitlisted');

    expect(result.waitlistPosition).toBe(2);
    expect(statusCounts(testDb.db, cls.id)).toEqual({ registered: 1, waitlisted: 2, cancelled: 1 });

    // Kelas Penuh dengan antrean: pendaftar baru ke ekor.
    const full = givenClass(testDb.db, { quota: 1 });
    await registrationsOf(testDb.services).register(full.publicCode, person('x'));
    await registrationsOf(testDb.services).register(full.publicCode, person('y'));
    const tail = await registrationsOf(testDb.services).register(full.publicCode, person('z'));
    expect(tail).toMatchObject({ status: 'waitlisted', waitlistPosition: 2, alreadyActive: false });
  });

  it('[P1] AC-12 R3: waitlist is FIFO by registration time, id breaks ties', async () => {
    const cls = givenClass(testDb.db, { quota: 1 });
    const [p1, p2, p3, p4] = [person('p1'), person('p2'), person('p3'), person('p4')];
    const people = [p1, p2, p3, p4];
    const results: RegistrationResult[] = [];
    for (const p of people) results.push(await registrationsOf(testDb.services).register(cls.publicCode, p));

    // Kriteria inti: posisi mengikuti urutan daftar.
    expect(results.map((r) => r.waitlistPosition ?? null)).toEqual([null, 1, 2, 3]);

    // Clock beku → created_at identik; urutan antrean hanya bisa berasal dari id.
    const rows = testDb.db
      .prepare('SELECT id, email, created_at AS createdAt FROM registrations WHERE class_id = ? ORDER BY id')
      .all(cls.id) as { id: number; email: string; createdAt: string }[];
    expect(rows.map((r) => r.email)).toEqual(people.map((p) => p.email));
    expect(new Set(rows.map((r) => r.createdAt))).toEqual(new Set([TEST_NOW_ISO]));

    // Posisi dibaca ulang (alreadyActive) tetap sama.
    const last = await registrationsOf(testDb.services).register(cls.publicCode, p4);
    expect(last).toMatchObject({ status: 'waitlisted', waitlistPosition: 3, alreadyActive: true });
    const second = await registrationsOf(testDb.services).register(cls.publicCode, p2);
    expect(second).toMatchObject({ waitlistPosition: 1, alreadyActive: true });
  });
});

/**
 * Automate Story 1.7 — cabang sekunder ATDD (`registrations` ditulis langsung hanya untuk fixture state Dibatalkan,
 * sama seperti AC-11; pembatalan sungguhan baru ada di Epik 2).
 */
describe('R2: one active registration per email per class — secondary branches (FR9, AD-5, AD-18)', () => {
  /** Fixture: membatalkan baris aktif tanpa promosi (bukan jalur `cancelRegistration`). */
  function cancelByFixture(classId: number, email: string): void {
    const result = testDb.db
      .prepare(
        "UPDATE registrations SET status = 'cancelled', cancelled_at = ?, cancelled_by = 'participant' WHERE class_id = ? AND email = ? AND status IN ('registered', 'waitlisted')",
      )
      .run(TEST_NOW_ISO, classId, email);
    expect(result.changes).toBe(1);
  }

  it('[P2] 1.7-INT-011 R2: a cancelled registration may register again as a new row at the waitlist tail', () => {
    const cls = givenClass(testDb.db, { quota: 1 });
    const [a, b, c] = [person('a'), person('b'), person('c')];
    testDb.services.registrations.register(cls.publicCode, a);
    const firstB = testDb.services.registrations.register(cls.publicCode, b);
    testDb.services.registrations.register(cls.publicCode, c);
    cancelByFixture(cls.id, b.email);

    const againB = testDb.services.registrations.register(cls.publicCode, b);

    // Kriteria inti: baris baru di ekor antrean (di belakang C), bukan menghidupkan baris lama.
    expect(againB).toMatchObject({ status: 'waitlisted', waitlistPosition: 2, alreadyActive: false });
    expect(againB.registrationRef).not.toBe(firstB.registrationRef);

    const rowsOfB = testDb.db
      .prepare('SELECT status, public_ref AS publicRef FROM registrations WHERE class_id = ? AND email = ? ORDER BY id')
      .all(cls.id, b.email);
    expect(rowsOfB).toEqual([
      { status: 'cancelled', publicRef: firstB.registrationRef },
      { status: 'waitlisted', publicRef: againB.registrationRef },
    ]);
    expect(statusCounts(testDb.db, cls.id)).toEqual({ registered: 1, waitlisted: 2, cancelled: 1 });
  });

  it('[P2] R2: the same email may be active in different classes, and each class counts only its own registrations', () => {
    const first = givenClass(testDb.db, { quota: 1 });
    const second = givenClass(testDb.db, { quota: 1 });
    const budi = person('budi');

    expect(testDb.services.registrations.register(first.publicCode, budi)).toMatchObject({ status: 'registered', alreadyActive: false });
    expect(testDb.services.registrations.register(second.publicCode, budi)).toMatchObject({ status: 'registered', alreadyActive: false });

    expect(statusCounts(testDb.db, first.id)).toEqual({ registered: 1, waitlisted: 0, cancelled: 0 });
    expect(statusCounts(testDb.db, second.id)).toEqual({ registered: 1, waitlisted: 0, cancelled: 0 });
  });

  it('[P2] AD-18 FR7: a finished class rejects registration_closed even for an email that is already active, without touching its row', () => {
    // Kelas dan pendaftaran dibuat sah lewat use-case saat kelas masih Dibuka (5 Nov); kini 9 Nov → Selesai.
    const pastNowIso = '2026-11-05T03:00:00.000Z';
    const cls = givenClass(testDb.db, { nowIso: pastNowIso, sessionDates: ['2026-11-06'] });
    const eko = person('eko');
    const past = createServices({ db: testDb.db, clock: fixedClock(pastNowIso) });
    expect(past.registrations.register(cls.publicCode, eko)).toMatchObject({ status: 'registered', alreadyActive: false });
    const snapshot = () => testDb.db.prepare('SELECT * FROM registrations WHERE class_id = ?').all(cls.id);
    const before = snapshot();

    // Kriteria inti: assertClassOpen mendahului cek aktif, jadi bukan 200 alreadyActive.
    expect(() => testDb.services.registrations.register(cls.publicCode, eko)).toThrow(
      expect.objectContaining({ code: 'registration_closed' }),
    );
    expect(() => testDb.services.registrations.register(cls.publicCode, person('baru'))).toThrow(
      expect.objectContaining({ code: 'registration_closed' }),
    );
    expect(snapshot()).toEqual(before);
  });
});
