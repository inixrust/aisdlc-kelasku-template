import fastifyCookie from '@fastify/cookie';
import Fastify, { type FastifyError, type FastifyInstance, type FastifyServerOptions, type RouteOptions } from 'fastify';
import { AppError, type ErrorCode, getError, isAppError, toErrorEnvelope } from '../../shared/errors.js';
import type { Services } from '../services/index.js';
import { ADMIN_ROUTES, adminPlugin, type AdminRoutes } from './admin-plugin.js';
import { authRoutes } from './routes/auth.js';
import { publicRegistrationsRoutes } from './routes/public-registrations.js';
import { registerSpaFallback } from './spa-fallback.js';

export interface BuildAppOptions {
  /** Use-case dari `createServices({ db, clock })`. */
  services: Services;
  /** Direktori hasil `vite build`; bawaan `dist/client` relatif terhadap direktori kerja. */
  clientDir?: string;
  logger?: FastifyServerOptions['logger'];
  /** `Secure` pada cookie sesi (`COOKIE_SECURE=true`); bawaan `false`. */
  cookieSecure?: boolean;
  /** Pendaftar rute admin tambahan (mis. rute uji); dipasang di dalam plugin auth `/api/admin`. */
  adminRoutes?: readonly AdminRoutes[];
  /** Dipanggil untuk setiap rute yang didaftarkan (inventaris rute, P0-008). */
  onRoute?: (route: RouteOptions) => void;
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH']);

function isApiPath(url: string): boolean {
  const pathname = url.split('?', 1)[0] ?? '';
  return pathname === '/api' || pathname.startsWith('/api/');
}

/** `application/json`, boleh dengan parameter (`; charset=utf-8`). Header kosong/tidak ada → false. */
function isJsonContentType(header: string | undefined): boolean {
  const mediaType = header?.split(';', 1)[0]?.trim().toLowerCase();
  return mediaType === 'application/json';
}

/** Kode registri untuk error non-`AppError` (error Fastify/parser, atau throw tak terduga). */
function codeForUnexpected(error: FastifyError): ErrorCode {
  const status = error.statusCode;
  if (status === 415) return 'unsupported_media_type';
  if (status === 404) return 'not_found';
  if (status !== undefined && status >= 400 && status < 500) return 'validation_error';
  return 'internal_error';
}

/** Merakit server Fastify di atas `services`: rute `/api/*` dan statis SPA (AD-1, AD-8, AD-9). */
export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  const cookieSecure = options.cookieSecure ?? false;

  if (options.onRoute !== undefined) app.addHook('onRoute', options.onRoute);

  // AD-8: setiap error keluar sebagai envelope. Pesan mentah error tak terduga hanya ke log.
  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (isAppError(error)) {
      return reply.code(error.httpStatus).send(error.toEnvelope());
    }
    const code = codeForUnexpected(error);
    if (code === 'internal_error') request.log.error({ err: error }, 'unhandled error');
    return reply.code(getError(code).httpStatus).send(toErrorEnvelope(code));
  });

  await app.register(fastifyCookie);
  app.decorateRequest('admin', null);

  // AD-9: tulis ke rute /api/* yang ada wajib JSON. `preParsing` berjalan setelah hook auth `onRequest`
  // plugin admin (tanpa sesi tetap 401) dan sebelum body diparse; rute tak dikenal tetap 404.
  app.addHook('preParsing', async (request, _reply, payload) => {
    if (
      WRITE_METHODS.has(request.method) &&
      !request.is404 &&
      isApiPath(request.url) &&
      !isJsonContentType(request.headers['content-type'])
    ) {
      throw new AppError('unsupported_media_type');
    }
    return payload;
  });

  await app.register(authRoutes, { prefix: '/api/auth', services: options.services, cookieSecure });
  await app.register(publicRegistrationsRoutes, { prefix: '/api/public', services: options.services });
  await app.register(adminPlugin, {
    prefix: '/api/admin',
    services: options.services,
    routes: [...ADMIN_ROUTES, ...(options.adminRoutes ?? [])],
  });

  await registerSpaFallback(app, options.clientDir ?? 'dist/client');
  return app;
}
