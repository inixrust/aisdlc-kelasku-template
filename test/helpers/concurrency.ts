/**
 * Harness konkurensi (AD-14, NFR-1): menjalankan satu task di `n` worker_threads, masing-masing
 * dengan koneksi SQLite sendiri ke berkas yang sama, dan melepas semuanya bersamaan lewat barrier
 * `SharedArrayBuffer` + `Atomics` (tanpa jeda tetap).
 *
 * Worker hidup di level modul dan dipakai ulang antar-panggilan (memulai worker tsx mahal),
 * sehingga 50 ulangan tetap murah. Panggil `stopConcurrencyWorkers()` di `afterAll`.
 */
import { threadId as mainThreadId, Worker } from 'node:worker_threads';
import type { Clock } from '../../src/server/clock.js';
import type { Db } from '../../src/server/data/db.js';
import type { Services } from '../../src/server/services/index.js';
import { TEST_NOW_ISO } from './test-db.js';

/** Jumlah ulangan setiap skenario konkurensi per run (NFR-1, R-008). */
export const CONCURRENCY_REPEATS = 50;

/** Yang diterima task di dalam worker. Koneksi `db` milik worker itu sendiri. */
export interface ConcurrentTaskContext<I> {
  db: Db;
  clock: Clock;
  services: Services;
  input: I;
  /** Urutan worker dalam panggilan ini, 0..n-1. */
  index: number;
}

export interface ConcurrentTask<I, O> {
  /** URL modul yang mengekspor task ini (worker mengimpornya ulang). */
  readonly module: string;
  /** Nama ekspor task di modul itu. */
  readonly exportName: string;
  readonly run: (ctx: ConcurrentTaskContext<I>) => O | Promise<O>;
}

/**
 * Mendefinisikan task yang bisa dijalankan worker. Task harus diekspor dari modulnya dengan
 * nama `exportName`, dan `moduleUrl` adalah `import.meta.url` modul itu:
 * `export const daftar = defineConcurrentTask(import.meta.url, 'daftar', ({ services }) => …)`.
 * Input dan nilai kembali harus bisa di-clone (structured clone).
 */
export function defineConcurrentTask<I = undefined, O = unknown>(
  moduleUrl: string,
  exportName: string,
  run: (ctx: ConcurrentTaskContext<I>) => O | Promise<O>,
): ConcurrentTask<I, O> {
  return { module: moduleUrl, exportName, run };
}

export type ConcurrentResult<O> =
  | { ok: true; value: O; index: number; threadId: number }
  | { ok: false; code: string | undefined; message: string; index: number; threadId: number };

export interface RunConcurrentlyOptions<I> {
  /** Berkas SQLite yang dibuka setiap worker (mis. `createTestDb().dbPath`). */
  dbPath: string;
  /** Input task; fungsi dipanggil per worker dengan `index`. */
  input?: I | ((index: number) => I);
  /** Instan clock beku di worker; bawaan `TEST_NOW_ISO`. */
  nowIso?: string;
  /** `busy_timeout` koneksi worker; bawaan 5000. */
  busyTimeoutMs?: number;
}

/** Pesan induk → worker. */
export interface WorkerJob {
  jobId: number;
  module: string;
  exportName: string;
  dbPath: string;
  nowIso: string;
  busyTimeoutMs: number | undefined;
  input: unknown;
  index: number;
  /** [0] = jumlah worker yang siap, [1] = 0 tertahan / 1 dilepas. */
  sync: Int32Array;
}

/** Pesan worker → induk. */
export type WorkerReply =
  | { jobId: number; ok: true; value: unknown; threadId: number }
  | { jobId: number; ok: false; code: string | undefined; message: string; threadId: number };

interface PooledWorker {
  worker: Worker;
  pending: { jobId: number; resolve: (reply: WorkerReply) => void; reject: (error: Error) => void } | null;
}

const WORKER_URL = new URL('./concurrency-worker.ts', import.meta.url);
const pool: PooledWorker[] = [];
let nextJobId = 1;

function spawnWorker(): PooledWorker {
  // Worker memuat berkas .ts lewat tsx (loader yang sama dengan `npm run dev`).
  const worker = new Worker(WORKER_URL, { execArgv: ['--import', 'tsx'] });
  const pooled: PooledWorker = { worker, pending: null };
  const fail = (error: Error): void => {
    const index = pool.indexOf(pooled);
    if (index !== -1) pool.splice(index, 1);
    const pending = pooled.pending;
    pooled.pending = null;
    pending?.reject(error);
  };
  worker.on('message', (reply: WorkerReply) => {
    const pending = pooled.pending;
    if (pending === null || pending.jobId !== reply.jobId) return;
    pooled.pending = null;
    pending.resolve(reply);
  });
  worker.on('error', (error) => fail(error));
  worker.on('exit', (code) => fail(new Error(`Worker konkurensi berhenti (exit ${code}).`)));
  worker.unref();
  pool.push(pooled);
  return pooled;
}

function dispatch(pooled: PooledWorker, job: WorkerJob): Promise<WorkerReply> {
  return new Promise((resolve, reject) => {
    pooled.pending = { jobId: job.jobId, resolve, reject };
    pooled.worker.postMessage(job);
  });
}

// `Atomics.waitAsync` (ES2024) ada di Node ≥ 16, tetapi `lib` tsconfig masih ES2023.
const atomicsWaitAsync = (
  Atomics as unknown as {
    waitAsync(
      array: Int32Array,
      index: number,
      value: number,
      timeoutMs: number,
    ): { async: false; value: 'not-equal' | 'timed-out' } | { async: true; value: Promise<'ok' | 'timed-out'> };
  }
).waitAsync.bind(Atomics);

async function waitUntilAllReady(sync: Int32Array, n: number, done: Promise<unknown>): Promise<void> {
  let failed = false;
  void done.catch(() => {
    failed = true;
  });
  for (;;) {
    const ready = Atomics.load(sync, 0);
    if (ready >= n) return;
    // Batas tunggu hanya jaring pengaman agar worker yang mati tidak menggantung test.
    const wait = atomicsWaitAsync(sync, 0, ready, 1000);
    if (wait.async) await wait.value;
    if (failed) return;
  }
}

/**
 * Menjalankan `task` di `n` worker bersamaan dan mengembalikan hasil per worker (urut `index`).
 * Error di dalam task tidak melempar; ia muncul sebagai `{ ok: false, code, message }`
 * (`code` = kode `AppError` atau kode SQLite).
 */
export async function runConcurrently<I, O>(
  n: number,
  task: ConcurrentTask<I, O>,
  options: RunConcurrentlyOptions<I>,
): Promise<Array<ConcurrentResult<O>>> {
  if (!Number.isInteger(n) || n < 2) throw new Error(`runConcurrently butuh minimal 2 worker (mendapat ${n}).`);
  while (pool.length < n) spawnWorker();

  const sync = new Int32Array(new SharedArrayBuffer(2 * Int32Array.BYTES_PER_ELEMENT));
  const inputOf = (index: number): unknown =>
    typeof options.input === 'function' ? (options.input as (index: number) => I)(index) : options.input;

  const workers = pool.slice(0, n);
  const replies = Promise.all(
    workers.map((pooled, index) =>
      dispatch(pooled, {
        jobId: nextJobId++,
        module: task.module,
        exportName: task.exportName,
        dbPath: options.dbPath,
        nowIso: options.nowIso ?? TEST_NOW_ISO,
        busyTimeoutMs: options.busyTimeoutMs,
        input: inputOf(index),
        index,
        sync,
      }),
    ),
  );

  try {
    await waitUntilAllReady(sync, n, replies);
  } finally {
    // Lepas semua worker sekaligus (juga saat gagal, agar tidak ada yang tertahan selamanya).
    Atomics.store(sync, 1, 1);
    Atomics.notify(sync, 1);
  }

  const results = await replies;
  return results.map((reply, index): ConcurrentResult<O> =>
    reply.ok
      ? { ok: true, value: reply.value as O, index, threadId: reply.threadId }
      : { ok: false, code: reply.code, message: reply.message, index, threadId: reply.threadId },
  );
}

/** Menghentikan semua worker pool. Panggil di `afterAll` file test yang memakai `runConcurrently`. */
export async function stopConcurrencyWorkers(): Promise<void> {
  const workers = pool.splice(0, pool.length);
  await Promise.all(workers.map(({ worker }) => worker.terminate()));
}

/**
 * Menjalankan `scenario` sebanyak `times` kali berurutan (ulangan ke-1..times). Bila satu ulangan
 * gagal, error menyebut "ulangan k dari times" dengan error aslinya sebagai `cause`.
 */
export async function repeatConcurrent<T>(
  times: number,
  scenario: (repetition: number) => T | Promise<T>,
): Promise<T[]> {
  const results: T[] = [];
  for (let repetition = 1; repetition <= times; repetition++) {
    try {
      results.push(await scenario(repetition));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`Skenario konkurensi gagal pada ulangan ${repetition} dari ${times}: ${detail}`, {
        cause: error,
      });
    }
  }
  return results;
}

/** threadId proses utama; worker selalu berbeda (dipakai test untuk membuktikan multi-koneksi). */
export const MAIN_THREAD_ID = mainThreadId;
