import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

const NOT_FOUND_ENVELOPE = {
  error: { code: 'not_found', message: 'Halaman atau data tidak ditemukan.' },
};

describe('HTTP shell: /api 404 envelope and SPA fallback (AD-1, AD-8)', () => {
  let clientDir: string;
  let app: FastifyInstance;

  beforeAll(async () => {
    clientDir = mkdtempSync(path.join(tmpdir(), 'kelasku-client-'));
    writeFileSync(path.join(clientDir, 'index.html'), '<!doctype html><html lang="id"><title>Kelasku</title></html>');
    mkdirSync(path.join(clientDir, 'assets'));
    writeFileSync(path.join(clientDir, 'assets', 'app-abc123.js'), 'console.log("kelasku");');
    app = await buildApp({ clientDir });
  });

  afterAll(async () => {
    await app.close();
    rmSync(clientDir, { recursive: true, force: true });
  });

  it.each(['GET', 'POST'] as const)('returns a 404 not_found envelope for unknown %s /api/* routes', async (method) => {
    const response = await app.inject({ method, url: '/api/tidak-ada' });
    expect(response.statusCode).toBe(404);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.json()).toEqual(NOT_FOUND_ENVELOPE);
  });

  it('treats /api itself and /api/ with a query string as API paths', async () => {
    for (const url of ['/api', '/api/tidak-ada?x=1']) {
      const response = await app.inject({ method: 'GET', url });
      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual(NOT_FOUND_ENVELOPE);
    }
  });

  it.each(['/', '/admin/kelas', '/daftar/abc?ref=1'])('serves index.html for non-API path %s', async (url) => {
    const response = await app.inject({ method: 'GET', url });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.body).toContain('<title>Kelasku</title>');
  });

  it('serves built static assets from the client directory', async () => {
    const response = await app.inject({ method: 'GET', url: '/assets/app-abc123.js' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('kelasku');
  });

  it('returns the 404 envelope for non-GET requests to non-API paths', async () => {
    const response = await app.inject({ method: 'POST', url: '/admin/kelas' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(NOT_FOUND_ENVELOPE);
  });
});

describe('HTTP shell without a client build (dev mode)', () => {
  it('returns the 404 envelope for every unknown path', async () => {
    const emptyDir = mkdtempSync(path.join(tmpdir(), 'kelasku-empty-'));
    const app = await buildApp({ clientDir: emptyDir });
    try {
      for (const url of ['/x', '/api/tidak-ada']) {
        const response = await app.inject({ method: 'GET', url });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toEqual(NOT_FOUND_ENVELOPE);
      }
    } finally {
      await app.close();
      rmSync(emptyDir, { recursive: true, force: true });
    }
  });
});
