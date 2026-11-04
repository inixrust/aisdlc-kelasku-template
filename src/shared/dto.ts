/**
 * Kontrak request/response bersama (AD-20). Tipe request diturunkan dari skema zod.
 */
import type { z } from 'zod';
import type { ClassStatus, RegistrationStatus } from './glossary.js';
import type { adminCredentialsSchema, createClassRequestSchema, loginRequestSchema, registrationRequestSchema } from './schemas.js';

export type LoginRequest = z.output<typeof loginRequestSchema>;
export type AdminCredentials = z.output<typeof adminCredentialsSchema>;
export type CreateClassRequest = z.output<typeof createClassRequestSchema>;
export type RegistrationRequest = z.output<typeof registrationRequestSchema>;

/** `POST /api/auth/login` dan `GET /api/auth/session`: email admin ternormalisasi. */
export interface AdminSessionResponse {
  email: string;
}

/** `POST /api/auth/logout`: selalu 200, idempoten. */
export interface LogoutResponse {
  loggedOut: true;
}

/** `POST /api/admin/classes` (201): kelas yang baru dibuat. `sessionDates` terurut naik; `today` WIB. */
export interface CreatedClassResponse {
  id: number;
  /** Kode tautan pendaftaran `/daftar/{publicCode}`; tidak memuat id internal. */
  publicCode: string;
  title: string;
  sessionDates: string[];
  quota: number;
  today: string;
}

/** `GET /api/admin/classes/:id`: kepala kelas admin, dengan status turunan dari domain (AD-6, AD-20). */
export interface AdminClassResponse extends CreatedClassResponse {
  status: ClassStatus;
}

/** `GET /api/public/classes/:code`: tanpa id internal, kuota, maupun data peserta (FR7, AD-10). */
export interface PublicClassResponse {
  publicCode: string;
  title: string;
  /** Terurut naik. */
  sessionDates: string[];
  status: ClassStatus;
  /** "Hari ini" WIB dari server. */
  today: string;
}

/**
 * `POST /api/public/classes/:code/registrations` (200), termasuk bila email sudah aktif (`alreadyActive`).
 * `waitlistPosition` hanya untuk Daftar tunggu (1-based, R3); `nextSessionDate` = sesi pertama ≥ today.
 */
export interface RegistrationResult {
  status: Extract<RegistrationStatus, 'registered' | 'waitlisted'>;
  waitlistPosition?: number;
  nextSessionDate?: string;
  alreadyActive: boolean;
  /** Ref acak 10 karakter base64url (pembatalan publik); bukan id internal. */
  registrationRef: string;
}
