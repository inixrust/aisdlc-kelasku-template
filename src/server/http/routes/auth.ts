import type { FastifyInstance } from 'fastify';
import type { AdminSessionResponse, LogoutResponse } from '../../../shared/dto.js';
import { AppError } from '../../../shared/errors.js';
import { loginRequestSchema } from '../../../shared/schemas.js';
import type { Services } from '../../services/index.js';
import { clearSessionCookie, readSessionToken, type SessionCookieOptions, setSessionCookie } from '../session-cookie.js';
import { parseWith } from '../validation.js';

export interface AuthRoutesOptions extends SessionCookieOptions {
  services: Services;
}

/** `/api/auth/{login,session,logout}` (AD-8, AD-9). Didaftarkan dengan prefix `/api/auth`. */
export async function authRoutes(app: FastifyInstance, options: AuthRoutesOptions): Promise<void> {
  const { services } = options;

  app.post('/login', async (request, reply): Promise<AdminSessionResponse> => {
    const body = parseWith(loginRequestSchema, request.body);
    const session = await services.auth.login(body);
    setSessionCookie(reply, session.token, options);
    return { email: session.email };
  });

  app.get('/session', async (request): Promise<AdminSessionResponse> => {
    const admin = services.auth.getSession(readSessionToken(request));
    if (admin === null) throw new AppError('unauthorized');
    return { email: admin.email };
  });

  app.post('/logout', async (request, reply): Promise<LogoutResponse> => {
    services.auth.logout(readSessionToken(request));
    clearSessionCookie(reply, options);
    return { loggedOut: true };
  });
}
