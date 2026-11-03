import { existsSync } from 'node:fs';
import path from 'node:path';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';
import { getError, toErrorEnvelope } from '../../shared/errors.js';

/**
 * Melayani SPA hasil `vite build` (AD-1) dan memasang not-found handler AD-8:
 * `/api/*` yang tidak dikenal → 404 envelope; path lain (GET/HEAD) → `index.html`.
 * Bila build klien belum ada (mode dev, Vite melayani klien), semua path tak dikenal → 404 envelope.
 */
export async function registerSpaFallback(app: FastifyInstance, clientDir: string): Promise<void> {
  const root = path.resolve(clientDir);
  const hasClientBuild = existsSync(path.join(root, 'index.html'));

  if (hasClientBuild) {
    await app.register(fastifyStatic, { root, wildcard: true, index: ['index.html'] });
  }

  app.setNotFoundHandler((request, reply) => {
    const pathname = request.url.split('?', 1)[0] ?? '';
    const isApi = pathname === '/api' || pathname.startsWith('/api/');
    // Aset build yang tidak ada (mis. hash lama setelah deploy) → 404, bukan index.html.
    const isMissingAsset = pathname.startsWith('/assets/');
    const isPageRequest = (request.method === 'GET' || request.method === 'HEAD') && !isMissingAsset;

    if (!isApi && isPageRequest && hasClientBuild) {
      return reply.type('text/html; charset=utf-8').sendFile('index.html');
    }
    return reply.code(getError('not_found').httpStatus).send(toErrorEnvelope('not_found'));
  });
}
