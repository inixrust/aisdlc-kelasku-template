/**
 * Skema zod untuk input yang divalidasi server (AD-8). Pesan per field berbahasa Indonesia;
 * kunci `fields` di envelope adalah path bertitik dari skema ini.
 */
import { z } from 'zod';
import { isCalendarDate } from './format.js';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Body bukan objek (string, array, null) diperlakukan sebagai objek kosong agar `fields` menyebut field wajib. */
const asObject = (value: unknown): unknown => (isPlainObject(value) ? value : {});

/**
 * Isu zod → `fields` envelope `validation_error` (path bertitik, pesan pertama per path).
 * Isu tanpa path (body itu sendiri) memakai kunci `body`.
 */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || 'body';
    fields[key] ??= issue.message;
  }
  return fields;
}

export const ADMIN_PASSWORD_MIN_LENGTH = 8;
export const PARTICIPANT_NAME_MAX_LENGTH = 100;
/** Sama dengan CHECK `registrations.email` (003_registrations.sql). */
export const EMAIL_MAX_LENGTH = 254;
export const CLASS_TITLE_MAX_LENGTH = 120;

export const SCHEMA_MESSAGES = {
  emailRequired: 'Email wajib diisi.',
  emailInvalid: 'Format email tidak valid.',
  emailTooLong: `Email maksimal ${EMAIL_MAX_LENGTH} karakter.`,
  passwordRequired: 'Password wajib diisi.',
  passwordTooShort: `Password minimal ${ADMIN_PASSWORD_MIN_LENGTH} karakter.`,
  titleRequired: 'Judul kelas wajib diisi.',
  titleTooLong: `Judul kelas maksimal ${CLASS_TITLE_MAX_LENGTH} karakter.`,
  quotaInvalid: 'Kuota harus bilangan bulat minimal 1.',
  sessionDatesRequired: 'Tambahkan minimal satu tanggal sesi.',
  sessionDateInvalid: 'Isi tanggal sesi yang valid atau hapus barisnya.',
  nameRequired: 'Nama wajib diisi.',
  nameTooLong: `Nama maksimal ${PARTICIPANT_NAME_MAX_LENGTH} karakter.`,
} as const;

const requiredEmail = z
  .string({ error: SCHEMA_MESSAGES.emailRequired })
  .trim()
  .min(1, { error: SCHEMA_MESSAGES.emailRequired });

/** `POST /api/auth/login`. Password tidak di-trim. */
export const loginRequestSchema = z.preprocess(
  asObject,
  z.object({
    email: requiredEmail,
    password: z.string({ error: SCHEMA_MESSAGES.passwordRequired }).min(1, { error: SCHEMA_MESSAGES.passwordRequired }),
  }),
);

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+$/;

/** Kredensial akun admin untuk `admin:create` dan `seed:demo` (use-case `upsertAdmin`). */
export const adminCredentialsSchema = z.object({
  email: requiredEmail.regex(EMAIL_FORMAT, { error: SCHEMA_MESSAGES.emailInvalid }),
  password: z
    .string({ error: SCHEMA_MESSAGES.passwordRequired })
    .min(ADMIN_PASSWORD_MIN_LENGTH, { error: SCHEMA_MESSAGES.passwordTooShort }),
});

/**
 * `POST /api/admin/classes` (FR2). Judul di-trim 1–120 karakter; kuota bilangan bulat ≥ 1 tanpa koersi
 * (string `"20"` ditolak); setiap tanggal `YYYY-MM-DD` kalender nyata. Daftar kosong, tanggal ganda, dan
 * aturan "minimal satu tanggal setelah hari ini" diperiksa `validateSessionDates` di domain (AD-19).
 */
export const createClassRequestSchema = z.preprocess(
  asObject,
  z.object({
    title: z
      .string({ error: SCHEMA_MESSAGES.titleRequired })
      .trim()
      .min(1, { error: SCHEMA_MESSAGES.titleRequired })
      .max(CLASS_TITLE_MAX_LENGTH, { error: SCHEMA_MESSAGES.titleTooLong }),
    sessionDates: z.array(
      z.string({ error: SCHEMA_MESSAGES.sessionDateInvalid }).refine(isCalendarDate, { error: SCHEMA_MESSAGES.sessionDateInvalid }),
      { error: SCHEMA_MESSAGES.sessionDatesRequired },
    ),
    quota: z.number({ error: SCHEMA_MESSAGES.quotaInvalid }).int({ error: SCHEMA_MESSAGES.quotaInvalid }).min(1, { error: SCHEMA_MESSAGES.quotaInvalid }),
  }),
);

/**
 * `POST /api/public/classes/:code/registrations` (FR7). Nama di-trim 1–100 karakter; email di-trim dan
 * berformat `x@y`. Normalisasi email (lowercase) dilakukan use-case lewat `normalizeEmail` (AD-5).
 */
export const registrationRequestSchema = z.preprocess(
  asObject,
  z.object({
    name: z
      .string({ error: SCHEMA_MESSAGES.nameRequired })
      .trim()
      .min(1, { error: SCHEMA_MESSAGES.nameRequired })
      .max(PARTICIPANT_NAME_MAX_LENGTH, { error: SCHEMA_MESSAGES.nameTooLong }),
    email: requiredEmail
      .max(EMAIL_MAX_LENGTH, { error: SCHEMA_MESSAGES.emailTooLong })
      .regex(EMAIL_FORMAT, { error: SCHEMA_MESSAGES.emailInvalid }),
  }),
);
