/**
 * ATDD fase merah Story 1.7 — AC-2 (1.7-UNIT-001, P1-012). Risiko: R-001, R-004, R-025.
 * Fungsi domain murni (AD-6): `classStatus` diperluas dengan Penuh, keputusan pendaftaran, dan posisi antrean.
 *
 * Kontrak yang diasumsikan (checklist ATDD 1.7, asumsi A-1):
 * - `classStatus({ sessionDates, today, quota, registeredCount })` di `./class-status.ts`.
 * - `./registration-rules.ts` mengekspor `decideRegistration({ registeredCount, quota, waitlistLength })`
 *   → `'registered' | 'waitlisted'` dan `waitlistPosition(waitlistIds, registrationId)` → posisi 1-based.
 * `registration-rules.ts` belum ada; impor dinamis agar typecheck hijau. `classStatus` di-cast karena
 * parameternya belum punya `quota`/`registeredCount`. Saat aktivasi: impor statis, buang cast, `it.fails` → `it`.
 *
 * FASE MERAH: aturan R1/R3 tidak boleh `.skip`, jadi `it.fails` (lihat registrations.concurrency.test.ts).
 */
import { describe, expect, it } from 'vitest';
import type { ClassStatus, RegistrationStatus } from '../../shared/glossary.js';
import { classStatus } from './class-status.js';

interface ClassStatusInput {
  sessionDates: readonly string[];
  today: string;
  quota: number;
  registeredCount: number;
}

interface RegistrationRules {
  decideRegistration(input: { registeredCount: number; quota: number; waitlistLength: number }): RegistrationStatus;
  waitlistPosition(waitlistIds: readonly number[], registrationId: number): number;
}

const REGISTRATION_RULES_MODULE = './registration-rules.js';

async function loadRegistrationRules(): Promise<RegistrationRules> {
  return (await import(/* @vite-ignore */ REGISTRATION_RULES_MODULE)) as RegistrationRules;
}

const classStatusWithQuota = classStatus as unknown as (input: ClassStatusInput) => ClassStatus;

const TODAY = '2026-11-09';
const UPCOMING = ['2026-11-16', '2026-11-23'];

describe('registration rules (R1, R3, FR8, FR10, AD-6)', () => {
  it.fails('[P1] AC-2 R1 R3: class status adds Penuh, registration is Terdaftar only with a free seat and an empty waitlist, waitlist position is 1-based by ascending id', async () => {
    // Kriteria inti: Penuh bila Dibuka dan Terdaftar = kuota.
    expect(classStatusWithQuota({ sessionDates: UPCOMING, today: TODAY, quota: 5, registeredCount: 5 })).toBe('full');

    expect(classStatusWithQuota({ sessionDates: UPCOMING, today: TODAY, quota: 5, registeredCount: 4 })).toBe('open');
    // Selesai menang atas Penuh; sepanjang tanggal sesi terakhir sudah Selesai (`<=`).
    expect(classStatusWithQuota({ sessionDates: ['2026-11-02', TODAY], today: TODAY, quota: 5, registeredCount: 5 })).toBe('finished');
    expect(classStatusWithQuota({ sessionDates: ['2026-11-02', TODAY], today: TODAY, quota: 5, registeredCount: 0 })).toBe('finished');

    const { decideRegistration, waitlistPosition } = await loadRegistrationRules();
    const cases: Array<[registeredCount: number, quota: number, waitlistLength: number, expected: RegistrationStatus]> = [
      [0, 5, 0, 'registered'],
      [4, 5, 0, 'registered'],
      [5, 5, 0, 'waitlisted'],
      [5, 5, 3, 'waitlisted'],
      // R3: ada kursi kosong tetapi antrean belum kosong → tetap ke ekor antrean.
      [3, 5, 2, 'waitlisted'],
      [0, 1, 1, 'waitlisted'],
    ];
    for (const [registeredCount, quota, waitlistLength, expected] of cases) {
      expect(decideRegistration({ registeredCount, quota, waitlistLength }), `${registeredCount}/${quota}, antrean ${waitlistLength}`).toBe(expected);
    }

    // Posisi 1-based menurut id naik, apa pun urutan masukannya.
    const waitlistIds = [42, 7, 19];
    expect(waitlistPosition(waitlistIds, 7)).toBe(1);
    expect(waitlistPosition(waitlistIds, 19)).toBe(2);
    expect(waitlistPosition(waitlistIds, 42)).toBe(3);
  });
});
