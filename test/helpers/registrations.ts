/**
 * Helper pendaftaran Story 1.7 (ATDD). Builder memanggil use-case, bukan SQL mentah (test-design §Prasyarat).
 *
 * `services.registrations` belum ada di tipe `Services` saat fase merah, jadi diakses lewat
 * `registrationsOf()` dengan bentuk kontrak yang diasumsikan (checklist ATDD 1.7, asumsi A-2).
 * Setelah use-case ada, `registrationsOf(services)` boleh diganti `services.registrations`.
 */
import type { CreatedClassResponse } from '../../src/shared/dto.js';
import { createDb, type Db } from '../../src/server/data/db.js';
import { createServices, type Services } from '../../src/server/services/index.js';
import { fixedClock, TEST_NOW_ISO } from './test-db.js';
import { uniqueTitle } from './unique.js';

/** Respons 200 `POST /api/public/classes/:code/registrations` (epics Story 1.7, AD-5, AD-20). */
export interface RegistrationResult {
  status: 'registered' | 'waitlisted';
  waitlistPosition?: number;
  nextSessionDate?: string;
  alreadyActive: boolean;
  registrationRef: string;
}

/** Bentuk use-case pendaftaran yang diasumsikan; boleh sinkron atau async, test selalu `await`. */
export interface RegistrationsService {
  register(publicCode: string, input: unknown): RegistrationResult | Promise<RegistrationResult>;
}

export function registrationsOf(services: Services): RegistrationsService {
  const registrations = (services as unknown as { registrations?: RegistrationsService }).registrations;
  if (registrations === undefined) throw new Error('services.registrations belum ada (Story 1.7).');
  return registrations;
}

export interface GivenClassOptions {
  quota?: number;
  /** Bawaan: dua sesi setelah `TEST_NOW_ISO` (16 dan 23 Nov 2026), jadi kelas Dibuka. */
  sessionDates?: string[];
  title?: string;
  /**
   * Instan clock saat kelas dibuat. Kelas Selesai dibuat sah lewat use-case dengan clock di masa lalu,
   * mis. `nowIso: '2026-11-05T03:00:00.000Z'` + `sessionDates: ['2026-11-06']`.
   */
  nowIso?: string;
}

/** Membuat kelas lewat `services.classes.createClass` pada koneksi `db`. */
export function givenClass(db: Db, options: GivenClassOptions = {}): CreatedClassResponse {
  const services = createServices({ db, clock: fixedClock(options.nowIso ?? TEST_NOW_ISO) });
  return services.classes.createClass({
    title: options.title ?? uniqueTitle('Kelas pendaftaran'),
    sessionDates: options.sessionDates ?? ['2026-11-16', '2026-11-23'],
    quota: options.quota ?? 5,
  });
}

/** Sama dengan `givenClass`, lewat koneksi sendiri ke berkas DB (mis. milik `startTestServer()`). */
export function givenClassInFile(dbPath: string, options: GivenClassOptions = {}): CreatedClassResponse {
  const db = createDb(dbPath);
  try {
    return givenClass(db, options);
  } finally {
    db.close();
  }
}

export interface StatusCounts {
  registered: number;
  waitlisted: number;
  cancelled: number;
}

/** Jumlah baris `registrations` per status untuk satu kelas (baca saja). */
export function statusCounts(db: Db, classId: number): StatusCounts {
  const rows = db
    .prepare('SELECT status, COUNT(*) AS n FROM registrations WHERE class_id = ? GROUP BY status')
    .all(classId) as { status: keyof StatusCounts; n: number }[];
  const counts: StatusCounts = { registered: 0, waitlisted: 0, cancelled: 0 };
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}

/** Jumlah pendaftaran aktif (Terdaftar + Daftar tunggu) satu kelas. */
export function activeCount(db: Db, classId: number): number {
  const { registered, waitlisted } = statusCounts(db, classId);
  return registered + waitlisted;
}

/** `[1, 2, …, n]`, untuk membandingkan posisi antrean tanpa celah maupun duplikat. */
export function oneTo(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i + 1);
}
