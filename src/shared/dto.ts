/**
 * Kontrak request/response bersama (AD-20). Tipe request diturunkan dari skema zod.
 */
import type { z } from 'zod';
import type { adminCredentialsSchema, loginRequestSchema } from './schemas.js';

export type LoginRequest = z.output<typeof loginRequestSchema>;
export type AdminCredentials = z.output<typeof adminCredentialsSchema>;

/** `POST /api/auth/login` dan `GET /api/auth/session`: email admin ternormalisasi. */
export interface AdminSessionResponse {
  email: string;
}

/** `POST /api/auth/logout`: selalu 200, idempoten. */
export interface LogoutResponse {
  loggedOut: true;
}
