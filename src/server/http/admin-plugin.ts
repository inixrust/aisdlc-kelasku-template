import type { FastifyInstance } from 'fastify';
import { AppError } from '../../shared/errors.js';
import type { AdminIdentity } from '../services/auth.js';
import type { Services } from '../services/index.js';
import { adminClassesRoutes } from './routes/admin-classes.js';
import { readSessionToken } from './session-cookie.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** Admin yang masuk; selalu terisi di handler di dalam `adminPlugin` (null di luar). */
    admin: AdminIdentity | null;
  }
}

/** Pendaftar rute admin; path relatif terhadap `/api/admin`. */
export type AdminRoutes = (admin: FastifyInstance, services: Services) => void | Promise<void>;

/** Rute admin produksi; story berikutnya menambahkan pendaftarnya di sini. */
export const ADMIN_ROUTES: readonly AdminRoutes[] = [adminClassesRoutes];

export interface AdminPluginOptions {
  services: Services;
  routes: readonly AdminRoutes[];
}

/**
 * Satu-satunya tempat rute `/api/admin/*` (AD-8). Hook `onRequest` menolak 401 `unauthorized`
 * sebelum body diparse dan sebelum handler berjalan bila tidak ada sesi valid (FR-1, NFR-8).
 */
export async function adminPlugin(app: FastifyInstance, options: AdminPluginOptions): Promise<void> {
  app.addHook('onRequest', async (request) => {
    const admin = options.services.auth.getSession(readSessionToken(request));
    if (admin === null) throw new AppError('unauthorized');
    request.admin = admin;
  });

  for (const register of options.routes) {
    await register(app, options.services);
  }
}
