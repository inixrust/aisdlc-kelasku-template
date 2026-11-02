import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify';
import { registerSpaFallback } from './spa-fallback.js';

export interface BuildAppOptions {
  /** Direktori hasil `vite build`; bawaan `dist/client` relatif terhadap direktori kerja. */
  clientDir?: string;
  logger?: FastifyServerOptions['logger'];
}

/** Merakit server Fastify: rute `/api/*` (story berikutnya) dan statis SPA (AD-1, AD-8). */
export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  await registerSpaFallback(app, options.clientDir ?? 'dist/client');
  return app;
}
