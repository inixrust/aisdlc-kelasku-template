/**
 * Entry worker_threads untuk `runConcurrently` (lihat `concurrency.ts`). Per job: buka koneksi
 * sendiri (`createDb` + `createServices`), lapor siap, tunggu barrier dilepas, jalankan task,
 * tutup koneksi, kirim hasil. Worker tetap hidup untuk job berikutnya.
 */
import { parentPort, threadId } from 'node:worker_threads';
import { createDb, type Db } from '../../src/server/data/db.js';
import { createServices } from '../../src/server/services/index.js';
import type { ConcurrentTask, WorkerJob, WorkerReply } from './concurrency.js';
import { fixedClock } from './test-db.js';

if (parentPort === null) throw new Error('concurrency-worker.ts harus dijalankan sebagai worker_threads.');
const port = parentPort;

async function loadTask(job: WorkerJob): Promise<ConcurrentTask<unknown, unknown>> {
  const mod = (await import(job.module)) as Record<string, unknown>;
  const task = mod[job.exportName] as ConcurrentTask<unknown, unknown> | undefined;
  if (task === undefined || typeof task.run !== 'function') {
    throw new Error(`Task "${job.exportName}" tidak ditemukan di ${job.module}.`);
  }
  return task;
}

function errorReply(jobId: number, error: unknown): WorkerReply {
  const code = (error as { code?: unknown } | null)?.code;
  return {
    jobId,
    ok: false,
    code: typeof code === 'string' ? code : undefined,
    message: error instanceof Error ? error.message : String(error),
    threadId,
  };
}

async function runJob(job: WorkerJob): Promise<WorkerReply> {
  let db: Db | undefined;
  let setupError: unknown;
  let run: (() => unknown) | undefined;
  try {
    const task = await loadTask(job);
    const clock = fixedClock(job.nowIso);
    const conn = createDb(job.dbPath, job.busyTimeoutMs === undefined ? {} : { busyTimeoutMs: job.busyTimeoutMs });
    db = conn;
    const services = createServices({ db: conn, clock });
    run = () => task.run({ db: conn, clock, services, input: job.input, index: job.index });
  } catch (error) {
    setupError = error;
  }

  // Barrier: lapor siap (juga saat setup gagal, agar induk tidak menunggu selamanya), lalu tunggu dilepas.
  Atomics.add(job.sync, 0, 1);
  Atomics.notify(job.sync, 0);
  Atomics.wait(job.sync, 1, 0);

  try {
    if (run === undefined) throw setupError;
    const value = await run();
    return { jobId: job.jobId, ok: true, value, threadId };
  } catch (error) {
    return errorReply(job.jobId, error);
  } finally {
    db?.close();
  }
}

port.on('message', (job: WorkerJob) => {
  runJob(job).then(
    (reply) => port.postMessage(reply),
    (error: unknown) => port.postMessage(errorReply(job.jobId, error)),
  );
});
