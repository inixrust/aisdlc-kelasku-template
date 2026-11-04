/**
 * Use-case kelas (FR2, FR5, FR6): buat kelas beserta sesinya dalam satu `withWriteTx` (AD-3) dan baca
 * kepala kelas admin dengan status turunan (AD-6, AD-20).
 */
import { randomBytes } from 'node:crypto';
import type { AdminClassResponse, CreateClassRequest, CreatedClassResponse } from '../../shared/dto.js';
import { AppError } from '../../shared/errors.js';
import { createClassRequestSchema, fieldErrorsOf } from '../../shared/schemas.js';
import type { Clock } from '../clock.js';
import * as classesRepo from '../data/classes-repo.js';
import { type Db, withWriteTx } from '../data/db.js';
import { classStatus } from '../domain/class-status.js';
import { sortSessionDates, validateSessionDates } from '../domain/session-dates.js';

export const PUBLIC_CODE_LENGTH = 10;
const MAX_CODE_ATTEMPTS = 5;

/**
 * Kode publik 10 karakter dari `crypto.randomBytes` (AD-10) dengan alfabet base64url tanpa digit
 * (`A–Z a–z - _`, 54 simbol ≈ 57 bit). Tanpa digit, id numerik internal tidak mungkin muncul
 * di tautan pendaftaran (P1-011).
 */
export function generatePublicCode(): string {
  let code = '';
  while (code.length < PUBLIC_CODE_LENGTH) {
    code += randomBytes(16).toString('base64url').replace(/[0-9]/g, '');
  }
  return code.slice(0, PUBLIC_CODE_LENGTH);
}

export interface ClassesService {
  /** Melempar `validation_error` + `fields` bila input atau tanggal sesi tidak sah; tidak ada baris yang ditulis. */
  createClass(input: unknown): CreatedClassResponse;
  /** Melempar `class_not_found` bila id tidak ada. */
  getClass(id: number): AdminClassResponse;
  /** Untuk `seed:demo` yang idempoten. */
  hasClassWithTitle(title: string): boolean;
}

export function createClassesService(deps: { db: Db; clock: Clock }): ClassesService {
  const { db, clock } = deps;

  return {
    createClass(input) {
      const parsed = createClassRequestSchema.safeParse(input);
      if (!parsed.success) throw new AppError('validation_error', { fields: fieldErrorsOf(parsed.error) });
      const request: CreateClassRequest = parsed.data;

      return withWriteTx(db, clock, (tx, ctx) => {
        const dateErrors = validateSessionDates(request.sessionDates, ctx.today);
        if (Object.keys(dateErrors).length > 0) throw new AppError('validation_error', { fields: dateErrors });

        let publicCode = generatePublicCode();
        for (let attempt = 1; classesRepo.publicCodeExists(tx, publicCode); attempt += 1) {
          if (attempt >= MAX_CODE_ATTEMPTS) throw new Error('createClass: gagal membuat public_code unik.');
          publicCode = generatePublicCode();
        }

        const sessionDates = sortSessionDates(request.sessionDates);
        const id = classesRepo.insertClass(tx, { publicCode, title: request.title, quota: request.quota, nowIso: ctx.nowIso });
        classesRepo.insertSessions(tx, id, sessionDates);
        return { id, publicCode, title: request.title, sessionDates, quota: request.quota, today: ctx.today };
      });
    },

    getClass(id) {
      const today = clock.todayJakarta();
      const row = Number.isSafeInteger(id) && id > 0 ? classesRepo.findClassById(db, id) : undefined;
      if (row === undefined) throw new AppError('class_not_found');
      const sessionDates = classesRepo.listSessionDates(db, row.id);
      return { ...row, sessionDates, today, status: classStatus({ sessionDates, today }) };
    },

    hasClassWithTitle(title) {
      return classesRepo.classTitleExists(db, title.trim());
    },
  };
}
