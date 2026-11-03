/**
 * Use-case auth admin (FR-1, AD-9, NFR-8): upsert akun, masuk, baca sesi, keluar.
 * - Password: scrypt (`node:crypto`), salt acak 16 byte per akun, keylen 64, dibandingkan dengan
 *   `timingSafeEqual`. Email tak dikenal tetap menjalankan scrypt agar waktunya setara.
 * - Token sesi: `randomBytes(32)` base64url, hanya hash SHA-256 hex yang disimpan.
 * - scrypt dihitung di luar transaksi; semua tulis lewat `withWriteTx`.
 */
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { normalizeEmail } from '../../shared/email.js';
import { AppError } from '../../shared/errors.js';
import { adminCredentialsSchema, fieldErrorsOf } from '../../shared/schemas.js';
import { addHoursIso, type Clock } from '../clock.js';
import * as adminsRepo from '../data/admins-repo.js';
import { type Db, withWriteTx } from '../data/db.js';

export const SESSION_TTL_HOURS = 12;
const SALT_BYTES = 16;
const KEY_LENGTH = 64;
const TOKEN_BYTES = 32;

function scryptHex(password: string, saltHex: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Salt dan hash pembanding untuk email tak dikenal (dibuat sekali per proses). */
const DUMMY_SALT = randomBytes(SALT_BYTES).toString('hex');
const DUMMY_HASH = Buffer.alloc(KEY_LENGTH);

export interface UpsertAdminResult {
  /** `true` bila akun baru dibuat, `false` bila password akun yang ada diperbarui. */
  created: boolean;
}

export interface LoginResult {
  /** Token mentah untuk cookie; tidak pernah disimpan atau dicatat. */
  token: string;
  email: string;
  expiresAt: string;
}

export interface AdminIdentity {
  id: number;
  email: string;
}

export interface AuthService {
  /** Buat akun atau perbarui password akun yang ada (idempoten). Mencabut sesi lama bila password diperbarui. */
  upsertAdmin(input: { email: string; password: string }): Promise<UpsertAdminResult>;
  /** Melempar `invalid_credentials` (identik untuk email tak dikenal dan password salah). */
  login(input: { email: string; password: string }): Promise<LoginResult>;
  /** Admin pemilik token bila sesinya masih berlaku, selain itu `null`. */
  getSession(token: string | undefined): AdminIdentity | null;
  /** Hapus sesi token ini bila ada; idempoten. */
  logout(token: string | undefined): void;
}

export function createAuthService(deps: { db: Db; clock: Clock }): AuthService {
  const { db, clock } = deps;

  return {
    async upsertAdmin(input) {
      const parsed = adminCredentialsSchema.safeParse(input);
      if (!parsed.success) throw new AppError('validation_error', { fields: fieldErrorsOf(parsed.error) });
      const email = normalizeEmail(parsed.data.email);
      const passwordSalt = randomBytes(SALT_BYTES).toString('hex');
      const passwordHash = (await scryptHex(parsed.data.password, passwordSalt)).toString('hex');

      return withWriteTx(db, clock, (tx, ctx) => {
        const existing = adminsRepo.findAdminByEmail(tx, email);
        if (existing === undefined) {
          adminsRepo.insertAdmin(tx, { email, passwordHash, passwordSalt, nowIso: ctx.nowIso });
          return { created: true };
        }
        adminsRepo.updateAdminPassword(tx, { id: existing.id, passwordHash, passwordSalt, nowIso: ctx.nowIso });
        adminsRepo.deleteSessionsOfAdmin(tx, existing.id);
        return { created: false };
      });
    },

    async login(input) {
      const email = normalizeEmail(input.email);
      const admin = adminsRepo.findAdminByEmail(db, email);
      const derived = await scryptHex(input.password, admin?.passwordSalt ?? DUMMY_SALT);
      const expected = admin === undefined ? DUMMY_HASH : Buffer.from(admin.passwordHash, 'hex');
      const matches = expected.length === derived.length && timingSafeEqual(derived, expected);
      if (admin === undefined || !matches) throw new AppError('invalid_credentials');

      const token = randomBytes(TOKEN_BYTES).toString('base64url');
      const tokenHash = hashToken(token);
      const expiresAt = withWriteTx(db, clock, (tx, ctx) => {
        // Baca ulang di dalam lock: password yang baru diverifikasi harus masih berlaku.
        const current = adminsRepo.findAdminById(tx, admin.id);
        if (current === undefined || current.passwordHash !== admin.passwordHash) {
          throw new AppError('invalid_credentials');
        }
        adminsRepo.deleteExpiredSessions(tx, ctx.nowIso);
        const sessionExpiresAt = addHoursIso(ctx.nowIso, SESSION_TTL_HOURS);
        adminsRepo.insertSession(tx, { adminId: admin.id, tokenHash, nowIso: ctx.nowIso, expiresAt: sessionExpiresAt });
        return sessionExpiresAt;
      });
      return { token, email: admin.email, expiresAt };
    },

    getSession(token) {
      if (token === undefined || token === '') return null;
      const nowIso = clock.now().toISOString();
      return adminsRepo.findAdminBySessionToken(db, hashToken(token), nowIso) ?? null;
    },

    logout(token) {
      if (token === undefined || token === '') return;
      const tokenHash = hashToken(token);
      withWriteTx(db, clock, (tx) => {
        adminsRepo.deleteSessionByTokenHash(tx, tokenHash);
      });
    },
  };
}
