/**
 * Kontrak request/response bersama (AD-20). Tipe request diturunkan dari skema zod.
 */
import type { z } from 'zod';
import type { ClassStatus } from './glossary.js';
import type { adminCredentialsSchema, createClassRequestSchema, loginRequestSchema } from './schemas.js';

export type LoginRequest = z.output<typeof loginRequestSchema>;
export type AdminCredentials = z.output<typeof adminCredentialsSchema>;
export type CreateClassRequest = z.output<typeof createClassRequestSchema>;

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
