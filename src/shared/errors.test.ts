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

  it('builds the error envelope with and without fields', () => {
    expect(toErrorEnvelope('not_found')).toEqual({
      error: { code: 'not_found', message: 'Halaman atau data tidak ditemukan.' },
    });
    expect(toErrorEnvelope('not_found', { title: 'x' })).toEqual({
      error: { code: 'not_found', message: 'Halaman atau data tidak ditemukan.', fields: { title: 'x' } },
    });
  });
});
