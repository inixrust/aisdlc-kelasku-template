/**
 * Skema zod untuk input yang divalidasi server (AD-8). Pesan per field berbahasa Indonesia;
 * kunci `fields` di envelope adalah path bertitik dari skema ini.
 */
import { z } from 'zod';

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

export const SCHEMA_MESSAGES = {
  emailRequired: 'Email wajib diisi.',
  emailInvalid: 'Format email tidak valid.',
  passwordRequired: 'Password wajib diisi.',
  passwordTooShort: `Password minimal ${ADMIN_PASSWORD_MIN_LENGTH} karakter.`,
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

/** Kredensial akun admin untuk `admin:create` dan `seed:demo` (use-case `upsertAdmin`). */
export const adminCredentialsSchema = z.object({
  email: requiredEmail.regex(/^[^\s@]+@[^\s@]+$/, { error: SCHEMA_MESSAGES.emailInvalid }),
  password: z
    .string({ error: SCHEMA_MESSAGES.passwordRequired })
    .min(ADMIN_PASSWORD_MIN_LENGTH, { error: SCHEMA_MESSAGES.passwordTooShort }),
});
