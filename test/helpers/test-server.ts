import { buildApp } from '../../src/server/http/app.js';
import { createTempDir } from './temp-dir.js';
import { createTestDb, type CreateTestDbOptions } from './test-db.js';

export interface TestServer {
  /** Mis. `http://127.0.0.1:41234`, tanpa garis miring akhir. */
  readonly baseUrl: string;
  /** Berkas SQLite server ini; worker atau test lain boleh membuka koneksi sendiri. */
  readonly dbPath: string;
  /** Tutup server dan koneksi DB, lalu hapus berkas sementara. */
  close(): Promise<void>;
}

/**
 * Server HTTP sungguhan di port acak (`listen({ port: 0 })`) di atas DB test baru, untuk test
 * yang butuh request HTTP bersamaan (R1, R2) alih-alih `fastify.inject()`. Tanpa build klien:
 * path tak dikenal menjawab 404 envelope.
 */
export async function startTestServer(options: CreateTestDbOptions = {}): Promise<TestServer> {
  const testDb = createTestDb(options);
  const emptyClientDir = createTempDir('kelasku-client-');
  const cleanup = (): void => {
    testDb.cleanup();
    emptyClientDir.cleanup();
  };

  try {
    const app = await buildApp({ services: testDb.services, clientDir: emptyClientDir.path });
    const address = await app.listen({ host: '127.0.0.1', port: 0 });
    return {
      baseUrl: address,
      dbPath: testDb.dbPath,
      close: async () => {
        try {
          await app.close();
        } finally {
          cleanup();
        }
      },
    };
  } catch (error) {
    cleanup();
    throw error;
  }
}
