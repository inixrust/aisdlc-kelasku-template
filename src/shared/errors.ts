/**
 * Registri kode error (AD-8). Setiap kode punya status HTTP dan pesan Indonesia.
 * Kode baru ditambahkan di sini, bukan sebagai string bebas di handler.
 * Status HTTP mengikuti AD-8 dan epics A-8 (HP-2). `network_error` dan `unexpected_response`
 * hanya dibuat oleh fetch wrapper klien; statusnya dipakai sebagai padanan saja.
 */
export const ERRORS = {
  validation_error: { httpStatus: 400, message: 'Periksa kembali isian yang ditandai.' },
  unauthorized: { httpStatus: 401, message: 'Sesi masuk Anda berakhir. Silakan masuk lagi.' },
  invalid_credentials: { httpStatus: 401, message: 'Email atau password salah' },
  not_found: { httpStatus: 404, message: 'Halaman atau data tidak ditemukan.' },
  unsupported_media_type: { httpStatus: 415, message: 'Format permintaan tidak didukung.' },
  unexpected_response: { httpStatus: 502, message: 'Server memberi jawaban yang tidak terduga. Coba lagi.' },
  database_busy: { httpStatus: 503, message: 'Server sedang sibuk, coba lagi.' },
  network_error: { httpStatus: 503, message: 'Tidak dapat menghubungi server. Coba lagi.' },
} as const satisfies Record<string, { httpStatus: number; message: string }>;

export type ErrorCode = keyof typeof ERRORS;

export interface ErrorDefinition {
  code: ErrorCode;
  httpStatus: number;
  message: string;
}

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
}

export function getError(code: ErrorCode): ErrorDefinition {
  return { code, ...ERRORS[code] };
}

export function toErrorEnvelope(code: ErrorCode, fields?: Record<string, string>): ErrorEnvelope {
  const { message } = ERRORS[code];
  return fields === undefined ? { error: { code, message } } : { error: { code, message, fields } };
}
