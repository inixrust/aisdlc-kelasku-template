/**
 * Fetch wrapper klien (AD-8): satu-satunya pemanggil `fetch` di `src/client/`.
 * - Kegagalan jaringan → `ApiError` `network_error`; respons tanpa envelope AD-8 (HTML, bukan JSON,
 *   kode tak dikenal) → `ApiError` `unexpected_response`. Pesan selalu dari registri `errors.ts`.
 * - 401 `unauthorized` → alihkan ke `/admin/masuk?next=<path saat ini>` dengan state `sessionExpired`,
 *   lalu tetap reject. Opsi `on401: 'throw'` mematikan pengalihan (login, cek sesi `AdminLayout`).
 */
import { ERRORS, type ErrorCode } from '../../shared/errors.js';

export const LOGIN_PATH = '/admin/masuk';
export const DEFAULT_NEXT_PATH = '/admin';

/** State navigasi ke halaman Masuk saat sesi habis di tengah pemakaian. */
export interface LoginLocationState {
  sessionExpired?: boolean;
}

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;
export type NavigateLike = (to: string, options: { replace?: boolean; state?: LoginLocationState }) => void;

interface ApiConfig {
  fetch: FetchLike;
  navigate: NavigateLike;
  /** Path + search halaman saat ini (untuk `next`). */
  currentPath: () => string;
}

const defaultConfig = (): ApiConfig => ({
  fetch: (input, init) => globalThis.fetch(input, init),
  navigate: (to) => {
    globalThis.location.assign(to);
  },
  currentPath: () => `${globalThis.location.pathname}${globalThis.location.search}`,
});

let config: ApiConfig = defaultConfig();

/** Pasang dependensi wrapper (router di `main.tsx`; `fetch` palsu di test). */
export function configureApi(overrides: Partial<ApiConfig>): void {
  config = { ...config, ...overrides };
}

/** Kembalikan wrapper ke dependensi bawaan (untuk test). */
export function resetApiConfig(): void {
  config = defaultConfig();
}

export class ApiError extends Error {
  readonly code: ErrorCode;
  /** Status HTTP respons; null bila request tidak sampai ke server. */
  readonly status: number | null;
  readonly fields: Record<string, string> | undefined;

  constructor(code: ErrorCode, options: { status?: number | null; fields?: Record<string, string>; cause?: unknown } = {}) {
    super(ERRORS[code].message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'ApiError';
    this.code = code;
    this.status = options.status ?? null;
    this.fields = options.fields;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/**
 * `next` sah hanya bila path same-origin: diawali satu `/` (bukan `//` atau `/\`) dan
 * `new URL(next, origin).origin === origin`. Selain itu (termasuk kosong) → `/admin`.
 */
export function safeNextPath(next: string | null | undefined, origin: string = globalThis.location.origin): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return DEFAULT_NEXT_PATH;
  }
  try {
    return new URL(next, origin).origin === origin ? next : DEFAULT_NEXT_PATH;
  } catch {
    return DEFAULT_NEXT_PATH;
  }
}

/** URL halaman Masuk yang kembali ke `next` setelah berhasil masuk. `/` tidak di-encode agar terbaca. */
export function loginPath(next: string): string {
  return `${LOGIN_PATH}?next=${encodeURIComponent(next).replaceAll('%2F', '/')}`;
}

export interface ApiRequestOptions {
  body?: unknown;
  /** `'redirect'` (bawaan): 401 `unauthorized` mengalihkan ke Masuk. `'throw'`: hanya reject. */
  on401?: 'redirect' | 'throw';
  signal?: AbortSignal;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.hasOwn(ERRORS, value);
}

/** Envelope AD-8 → `ApiError`; null bila bentuknya bukan envelope. */
function errorFromEnvelope(payload: unknown, status: number): ApiError | null {
  if (!isRecord(payload) || !isRecord(payload['error'])) return null;
  const { code, message, fields } = payload['error'];
  if (!isErrorCode(code) || typeof message !== 'string') return null;
  if (fields !== undefined && !(isRecord(fields) && Object.values(fields).every((v) => typeof v === 'string'))) return null;
  return new ApiError(code, { status, fields: fields as Record<string, string> | undefined });
}

async function readJson(response: Response): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    return { ok: true, value: await response.json() };
  } catch {
    return { ok: false };
  }
}

export async function apiRequest<T>(method: Method, path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init: RequestInit = { method, credentials: 'same-origin', cache: 'no-store', headers };
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(options.body ?? {});
  }
  if (options.signal !== undefined) init.signal = options.signal;

  let response: Response;
  try {
    response = await config.fetch(path, init);
  } catch (cause) {
    throw new ApiError('network_error', { cause });
  }

  const json = await readJson(response);
  if (response.ok) {
    if (!json.ok) throw new ApiError('unexpected_response', { status: response.status });
    return json.value as T;
  }

  const error = (json.ok ? errorFromEnvelope(json.value, response.status) : null) ?? new ApiError('unexpected_response', { status: response.status });
  if (error.code === 'unauthorized' && (options.on401 ?? 'redirect') === 'redirect') {
    const current = config.currentPath();
    if (!current.startsWith(LOGIN_PATH)) {
      config.navigate(loginPath(current), { replace: true, state: { sessionExpired: true } });
    }
  }
  throw error;
}
