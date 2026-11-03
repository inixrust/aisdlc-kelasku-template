import type { FastifyReply, FastifyRequest } from 'fastify';

/** Cookie sesi admin (AD-9). Isinya token mentah; tidak pernah dicatat ke log. */
export const SESSION_COOKIE = 'kelasku_session';

export interface SessionCookieOptions {
  /** `Secure` hanya bila `COOKIE_SECURE=true` (di belakang HTTPS). */
  cookieSecure: boolean;
}

function cookieAttributes(options: SessionCookieOptions) {
  return { path: '/', httpOnly: true, sameSite: 'lax', secure: options.cookieSecure } as const;
}

export function readSessionToken(request: FastifyRequest): string | undefined {
  const value = request.cookies[SESSION_COOKIE];
  return value === undefined || value === '' ? undefined : value;
}

/** Cookie sesi browser (tanpa `Expires`); kedaluwarsa 12 jam ditegakkan server lewat `admin_sessions`. */
export function setSessionCookie(reply: FastifyReply, token: string, options: SessionCookieOptions): void {
  reply.setCookie(SESSION_COOKIE, token, cookieAttributes(options));
}

export function clearSessionCookie(reply: FastifyReply, options: SessionCookieOptions): void {
  reply.clearCookie(SESSION_COOKIE, cookieAttributes(options));
}
