import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { isAppError } from '../../shared/errors.js';
import type { Services } from '../services/index.js';
import { registerSpaFallback } from './spa-fallback.js';

export interface BuildAppOptions {
  /** Use-case dari `createServices({ db, clock })`; route `/api/*` story berikutnya memanggilnya. */
  services: Services;
  /** Direktori hasil `vite build`; bawaan `dist/client` relatif terhadap direktori kerja. */
  clientDir?: string;
  logger?: FastifyServerOptions['logger'];
}

/** Merakit server Fastify di atas `services`: rute `/api/*` (story berikutnya) dan statis SPA (AD-1, AD-8). */
export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });

  // AD-8: error berkode registri (mis. database_busy dari withWriteTx) → status + envelope.
  app.setErrorHandler((error, _request, reply) => {
    if (isAppError(error)) {
      return reply.code(error.httpStatus).send(error.toEnvelope());
    }
    return reply.send(error);
  });

  await registerSpaFallback(app, options.clientDir ?? 'dist/client');
  return app;
}
