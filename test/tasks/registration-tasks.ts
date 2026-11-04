/**
 * Task worker untuk test konkurensi pendaftaran Story 1.7 (R1, R2). Harus di modul yang bukan
 * `*.test.ts`, karena worker mengimpor ulang modul ini (test/README.md §Helper DB).
 *
 * - `registerAtomic`: jalur produksi, `services.registrations.register` (satu `withWriteTx`, AD-3/AD-5).
 * - `registerNonAtomic`: MUTAN untuk mutation check A-11. Membaca dan memutuskan di luar transaksi tulis,
 *   lalu menulis di `withWriteTx` terpisah. Dirakit dari seam tx-step yang diekspor
 *   `src/server/services/registrations.ts` (test-design-epic-1 asumsi 2; checklist ATDD 1.7 asumsi A-3):
 *     planRegistration(tx, ctx, { publicCode, name, email })  → keputusan (assertClassOpen, cek aktif, COUNT, antrean)
 *     applyRegistration(tx, ctx, plan)                         → insert + RegistrationResult
 *   Produksi memanggil keduanya di satu callback `withWriteTx`; tidak ada flag mutan di kode produksi.
 */
import { type Tx, withWriteTx, type WriteCtx } from '../../src/server/data/db.js';
import { defineConcurrentTask } from '../helpers/concurrency.js';
import { applyRegistration, planRegistration } from '../../src/server/services/registrations.js';
import { type RegistrationResult, registrationsOf } from '../helpers/registrations.js';

export interface RegisterTaskInput {
  publicCode: string;
  name: string;
  email: string;
}

/** Bagian hasil yang dibandingkan test (bisa di-clone antar-thread). */
export interface RegisterTaskOutput {
  status: RegistrationResult['status'];
  waitlistPosition: number | null;
  alreadyActive: boolean;
}

function toOutput(result: RegistrationResult): RegisterTaskOutput {
  return {
    status: result.status,
    waitlistPosition: result.waitlistPosition ?? null,
    alreadyActive: result.alreadyActive,
  };
}

export const registerAtomic = defineConcurrentTask<RegisterTaskInput, RegisterTaskOutput>(
  import.meta.url,
  'registerAtomic',
  async ({ services, input }) =>
    toOutput(await registrationsOf(services).register(input.publicCode, { name: input.name, email: input.email })),
);


export const registerNonAtomic = defineConcurrentTask<RegisterTaskInput, RegisterTaskOutput>(
  import.meta.url,
  'registerNonAtomic',
  ({ db, clock, input }) => {
    const readCtx: WriteCtx = { nowIso: clock.now().toISOString(), today: clock.todayJakarta() };
    // Pola terlarang AD-3: COUNT Terdaftar, antrean, dan cek aktif dibaca TANPA write lock…
    const plan = planRegistration(db as Tx, readCtx, input);
    // …lalu ditulis di transaksi lain, sehingga worker lain bisa menyelip di antaranya.
    return toOutput(withWriteTx(db, clock, (tx, ctx) => applyRegistration(tx, ctx, plan)));
  },
);
