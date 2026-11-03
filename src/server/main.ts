import { createClock } from './clock.js';
import { readCookieSecure, readDatabasePath } from './config.js';
import { createDb, migrate } from './data/db.js';
import { buildApp } from './http/app.js';
import { createServices } from './services/index.js';

const DEFAULT_PORT = 3000;
// Story 4.7 menambah HOST; sampai itu server hanya mendengar di loopback.
const HOST = '127.0.0.1';

function readPort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT tidak valid: ${raw}`);
  }
  return port;
}

async function main(): Promise<void> {
  const port = readPort(process.env.PORT);
  const clock = createClock();
  const db = createDb(readDatabasePath(process.env.DATABASE_PATH));
  // AD-12: migrasi tertunda (dengan salinan pra-migrasi) sebelum menerima request; gagal → exit ≠ 0.
  migrate(db, { now: () => clock.now() });

  const services = createServices({ db, clock });
  const app = await buildApp({
    services,
    cookieSecure: readCookieSecure(process.env.COOKIE_SECURE),
    logger: process.env.NODE_ENV === 'test' ? { level: 'warn' } : true,
  });
  app.addHook('onClose', async () => {
    db.close();
  });

  const shutdown = (): void => {
    app.close().then(
      () => process.exit(0),
      (error: unknown) => {
        console.error(error);
        process.exit(1);
      },
    );
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  await app.listen({ host: HOST, port });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
