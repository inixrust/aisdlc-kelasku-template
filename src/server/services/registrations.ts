/**
 * Use-case pendaftaran publik (FR7–FR10, R1–R3, AD-3, AD-5, AD-18).
 *
 * Pendaftaran = satu `withWriteTx`: `planRegistration` (assertClassOpen → cari aktif → COUNT Terdaftar +
 * antrean → keputusan, tanpa tulis) lalu `applyRegistration` (insert + hasil), di callback sinkron yang sama.
 * Keduanya tx-step terpisah hanya agar test bisa merakit mutan non-atomik (A-11); tidak ada flag mutan di sini.
 */
import { randomBytes } from 'node:crypto';
import type { PublicClassResponse, RegistrationRequest, RegistrationResult } from '../../shared/dto.js';
import { normalizeEmail } from '../../shared/email.js';
import { AppError } from '../../shared/errors.js';
import { fieldErrorsOf, registrationRequestSchema } from '../../shared/schemas.js';
import type { Clock } from '../clock.js';
import * as classesRepo from '../data/classes-repo.js';
import { type Db, type Tx, withWriteTx, type WriteCtx } from '../data/db.js';
import * as registrationsRepo from '../data/registrations-repo.js';
import { classStatus, nextSessionDate } from '../domain/class-status.js';
import { decideRegistration, waitlistPosition } from '../domain/registration-rules.js';
import { assertClassOpen } from './class-guard.js';

export const REGISTRATION_REF_LENGTH = 10;
const MAX_REF_ATTEMPTS = 5;

/** Ref publik 10 karakter base64url dari `crypto.randomBytes` (60 bit acak, AD-10); tidak berurutan. */
export function generateRegistrationRef(): string {
  return randomBytes(8).toString('base64url').slice(0, REGISTRATION_REF_LENGTH);
}

export interface RegistrationInput {
  publicCode: string;
  name: string;
  email: string;
}

/** Keputusan yang dibuat `planRegistration`; ditulis apa adanya oleh `applyRegistration`. */
export type RegistrationPlan =
  | {
      kind: 'existing';
      classId: number;
      sessionDates: string[];
      registrationId: number;
      publicRef: string;
      status: registrationsRepo.ActiveStatus;
    }
  | {
      kind: 'new';
      classId: number;
      sessionDates: string[];
      email: string;
      name: string;
      status: registrationsRepo.ActiveStatus;
    };

/** Kode kelas tak dikenal → `class_not_found`. */
function classIdOf(db: Db, publicCode: string): number {
  const row = classesRepo.findClassByPublicCode(db, publicCode);
  if (row === undefined) throw new AppError('class_not_found');
  return row.id;
}

/** Tx-step: semua baca yang mendasari keputusan (AD-3, AD-5). Tidak menulis. */
export function planRegistration(tx: Tx, ctx: WriteCtx, input: RegistrationInput): RegistrationPlan {
  const cls = assertClassOpen(tx, ctx, classIdOf(tx, input.publicCode), 'register');
  const email = normalizeEmail(input.email);

  const active = registrationsRepo.findActiveRegistration(tx, cls.id, email);
  if (active !== undefined) {
    return {
      kind: 'existing',
      classId: cls.id,
      sessionDates: cls.sessionDates,
      registrationId: active.id,
      publicRef: active.publicRef,
      status: active.status,
    };
  }

  const status = decideRegistration({
    registeredCount: registrationsRepo.countRegistered(tx, cls.id),
    quota: cls.quota,
    waitlistLength: registrationsRepo.listWaitlistIds(tx, cls.id).length,
  });
  return { kind: 'new', classId: cls.id, sessionDates: cls.sessionDates, email, name: input.name, status };
}

/** Tx-step: menulis keputusan `plan` (bila baru) dan membentuk hasil 200. */
export function applyRegistration(tx: Tx, ctx: WriteCtx, plan: RegistrationPlan): RegistrationResult {
  let registrationId: number;
  let publicRef: string;
  if (plan.kind === 'existing') {
    registrationId = plan.registrationId;
    publicRef = plan.publicRef;
  } else {
    publicRef = generateRegistrationRef();
    for (let attempt = 1; registrationsRepo.publicRefExists(tx, publicRef); attempt += 1) {
      if (attempt >= MAX_REF_ATTEMPTS) throw new Error('applyRegistration: gagal membuat public_ref unik.');
      publicRef = generateRegistrationRef();
    }
    registrationId = registrationsRepo.insertRegistration(tx, {
      publicRef,
      classId: plan.classId,
      email: plan.email,
      name: plan.name,
      status: plan.status,
      nowIso: ctx.nowIso,
    });
  }

  const result: RegistrationResult = { status: plan.status, alreadyActive: plan.kind === 'existing', registrationRef: publicRef };
  if (plan.status === 'waitlisted') {
    result.waitlistPosition = waitlistPosition(registrationsRepo.listWaitlistIds(tx, plan.classId), registrationId);
  }
  const next = nextSessionDate(plan.sessionDates, ctx.today);
  if (next !== undefined) result.nextSessionDate = next;
  return result;
}

/** Pelanggaran unique index parsial R2 (insert ganda yang lolos cek di transaksi). */
function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export interface RegistrationsService {
  /**
   * Mendaftarkan peserta. 200-hasil termasuk Daftar tunggu dan `alreadyActive`. Melempar `validation_error`
   * (+ `fields`), `class_not_found`, atau `registration_closed`; tidak ada baris yang ditulis bila melempar.
   */
  register(publicCode: string, input: unknown): RegistrationResult;
  /** Kepala kelas publik. Melempar `class_not_found` bila kode tak dikenal. */
  getPublicClass(publicCode: string): PublicClassResponse;
}

export function createRegistrationsService(deps: { db: Db; clock: Clock }): RegistrationsService {
  const { db, clock } = deps;

  return {
    register(publicCode, input) {
      const parsed = registrationRequestSchema.safeParse(input);
      if (!parsed.success) throw new AppError('validation_error', { fields: fieldErrorsOf(parsed.error) });
      const request: RegistrationRequest = parsed.data;
      const args: RegistrationInput = { publicCode, name: request.name, email: request.email };
      const attempt = (): RegistrationResult =>
        withWriteTx(db, clock, (tx, ctx) => applyRegistration(tx, ctx, planRegistration(tx, ctx, args)));

      try {
        return attempt();
      } catch (error) {
        // AD-5: bila unique index menolak, baca ulang di transaksi baru → bentuk `alreadyActive`.
        if (isUniqueViolation(error)) return attempt();
        throw error;
      }
    },

    getPublicClass(publicCode) {
      const today = clock.todayJakarta();
      const row = classesRepo.findClassByPublicCode(db, publicCode);
      if (row === undefined) throw new AppError('class_not_found');
      const sessionDates = classesRepo.listSessionDates(db, row.id);
      const registeredCount = registrationsRepo.countRegistered(db, row.id);
      return {
        publicCode: row.publicCode,
        title: row.title,
        sessionDates,
        status: classStatus({ sessionDates, today, quota: row.quota, registeredCount }),
        today,
      };
    },
  };
}
