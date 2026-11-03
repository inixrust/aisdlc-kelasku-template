import { describe, expect, it } from 'vitest';
import { ERRORS, getError, toErrorEnvelope, type ErrorCode } from './errors.js';

describe('error registry (AD-8)', () => {
  it('gives every code an HTTP status and a non-empty Indonesian message', () => {
    for (const code of Object.keys(ERRORS) as ErrorCode[]) {
      const definition = getError(code);
      expect(definition.code).toBe(code);
      expect(definition.httpStatus).toBeGreaterThanOrEqual(400);
      expect(definition.message.trim()).not.toBe('');
    }
  });

  it.each([
    ['not_found', 404],
    ['validation_error', 400],
    ['unauthorized', 401],
    ['invalid_credentials', 401],
    ['unsupported_media_type', 415],
    ['database_busy', 503],
    ['network_error', 503],
    ['unexpected_response', 502],
  ] as const)('registers %s with HTTP %i (HP-2)', (code, httpStatus) => {
    expect(getError(code)).toEqual({ code, httpStatus, message: ERRORS[code].message });
  });

  it('builds a validation_error envelope with dotted field paths', () => {
    expect(toErrorEnvelope('validation_error', { 'sessionDates.2': 'Tanggal sudah ada' })).toEqual({
      error: {
        code: 'validation_error',
        message: 'Periksa kembali isian yang ditandai.',
        fields: { 'sessionDates.2': 'Tanggal sudah ada' },
      },
    });
  });

  it('builds the error envelope with and without fields', () => {
    expect(toErrorEnvelope('not_found')).toEqual({
      error: { code: 'not_found', message: 'Halaman atau data tidak ditemukan.' },
    });
    expect(toErrorEnvelope('not_found', { title: 'x' })).toEqual({
      error: { code: 'not_found', message: 'Halaman atau data tidak ditemukan.', fields: { title: 'x' } },
    });
  });
});
