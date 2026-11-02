/**
 * Registri kode error (AD-8). Setiap kode punya status HTTP dan pesan Indonesia.
 * Kode baru ditambahkan di sini, bukan sebagai string bebas di handler.
 * Story 1.2 melengkapi registri ini.
 */
export const ERRORS = {
  not_found: { httpStatus: 404, message: 'Halaman atau data tidak ditemukan.' },
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
