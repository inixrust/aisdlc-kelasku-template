import { mkdirSync, writeFileSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTempDir, type TempDir } from '../../../test/helpers/temp-dir.js';
import { createTestDb, type TestDb } from '../../../test/helpers/test-db.js';
import { AppError, toErrorEnvelope } from '../../shared/errors.js';
import { buildApp } from './app.js';

const NOT_FOUND_ENVELOPE = {
  error: { code: 'not_found', message: 'Halaman atau data tidak ditemukan.' },
};

let testDb: TestDb;
beforeAll(() => {
  testDb = createTestDb();
});
afterAll(() => {
  testDb.cleanup();
});

describe('HTTP shell: /api 404 envelope and SPA fallback (AD-1, AD-8)', () => {
  let clientDir: TempDir;
  let app: FastifyInstance;

  beforeAll(async () => {
    clientDir = createTempDir('kelasku-client-');
    writeFileSync(clientDir.file('index.html'), '<!doctype html><html lang="id"><title>Kelasku</title></html>');
    mkdirSync(clientDir.file('assets'));
    writeFileSync(clientDir.file('assets', 'app-abc123.js'), 'console.log("kelasku");');
    app = await buildApp({ services: testDb.services, clientDir: clientDir.path });
  });

  afterAll(async () => {
    await app.close();
    clientDir.cleanup();
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

  it('serves index.html for HEAD requests to SPA deep links', async () => {
    const response = await app.inject({ method: 'HEAD', url: '/admin/kelas' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
  });

  it('returns the 404 envelope for missing build assets instead of index.html', async () => {
    const response = await app.inject({ method: 'GET', url: '/assets/old-hash.js' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(NOT_FOUND_ENVELOPE);
  });

  it('returns the 404 envelope for non-GET requests to non-API paths', async () => {
    const response = await app.inject({ method: 'POST', url: '/admin/kelas' });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(NOT_FOUND_ENVELOPE);
  });
});

describe('HTTP shell without a client build (dev mode)', () => {
  it('returns the 404 envelope for every unknown path', async () => {
    const emptyDir = createTempDir('kelasku-empty-');
    const app = await buildApp({ services: testDb.services, clientDir: emptyDir.path });
    try {
      for (const url of ['/x', '/api/tidak-ada']) {
        const response = await app.inject({ method: 'GET', url });
        expect(response.statusCode).toBe(404);
        expect(response.json()).toEqual(NOT_FOUND_ENVELOPE);
      }
    } finally {
      await app.close();
      emptyDir.cleanup();
    }
  });
});

describe('HTTP error mapping (AD-8, R-020)', () => {
  let emptyDir: TempDir;
  let app: FastifyInstance;

  beforeAll(async () => {
    emptyDir = createTempDir('kelasku-empty-');
    app = await buildApp({ services: testDb.services, clientDir: emptyDir.path });
    // Rute uji saja: meniru use-case yang melempar AppError (mis. database_busy dari withWriteTx).
    app.get('/api/uji/sibuk', () => {
      throw new AppError('database_busy', { cause: Object.assign(new Error('database is locked'), { code: 'SQLITE_BUSY' }) });
    });
    app.post('/api/uji/validasi', () => {
      throw new AppError('validation_error', { fields: { 'sessionDates.2': 'Tanggal sudah ada' } });
    });
  });

  afterAll(async () => {
    await app.close();
    emptyDir.cleanup();
  });

  it('maps AppError database_busy to HTTP 503 with the error envelope', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/uji/sibuk' });
    expect(response.statusCode).toBe(503);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.json()).toEqual(toErrorEnvelope('database_busy'));
    expect(response.body).not.toContain('SQLITE_BUSY');
  });

  it('keeps AppError fields in the envelope', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/uji/validasi' });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(toErrorEnvelope('validation_error', { 'sessionDates.2': 'Tanggal sudah ada' }));
  });
});
