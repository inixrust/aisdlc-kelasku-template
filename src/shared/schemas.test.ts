import { describe, expect, it } from 'vitest';
import { normalizeEmail } from './email.js';
import {
  adminCredentialsSchema,
  EMAIL_MAX_LENGTH,
  fieldErrorsOf,
  loginRequestSchema,
  registrationRequestSchema,
  SCHEMA_MESSAGES,
} from './schemas.js';

describe('normalizeEmail (AD-5)', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Rina@Lembaga.ID \n')).toBe('rina@lembaga.id');
    expect(normalizeEmail('rina@lembaga.id')).toBe('rina@lembaga.id');
  });
});

describe('loginRequestSchema (FR-1)', () => {
  it('accepts an email and password, trimming only the email', () => {
    expect(loginRequestSchema.parse({ email: ' Rina@Lembaga.id ', password: ' rahasia ' })).toEqual({
      email: 'Rina@Lembaga.id',
      password: ' rahasia ',
    });
  });

  it.each([
    ['an empty object', {}],
    ['a non-object body', 'teks'],
    ['an array body', []],
    ['null', null],
    ['blank values', { email: '   ', password: '' }],
    ['wrong types', { email: 1, password: false }],
  ])('reports both required fields for %s', (_label, input) => {
    const result = loginRequestSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsOf(result.error)).toEqual({
        email: SCHEMA_MESSAGES.emailRequired,
        password: SCHEMA_MESSAGES.passwordRequired,
      });
    }
  });
});

describe('adminCredentialsSchema', () => {
  it('requires a plausible email and a password of at least 8 characters', () => {
    expect(adminCredentialsSchema.safeParse({ email: 'rina@lembaga.id', password: '12345678' }).success).toBe(true);
    const result = adminCredentialsSchema.safeParse({ email: 'rina', password: '1234567' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsOf(result.error)).toEqual({
        email: SCHEMA_MESSAGES.emailInvalid,
        password: SCHEMA_MESSAGES.passwordTooShort,
      });
    }
  });
});

describe('registrationRequestSchema (FR7)', () => {
  it('rejects an email longer than the registrations column allows instead of failing in SQLite', () => {
    const atLimit = `${'a'.repeat(EMAIL_MAX_LENGTH - 6)}@x.id`.padEnd(EMAIL_MAX_LENGTH, 'd');
    expect(atLimit).toHaveLength(EMAIL_MAX_LENGTH);
    expect(registrationRequestSchema.safeParse({ name: 'Rina', email: atLimit }).success).toBe(true);

    const result = registrationRequestSchema.safeParse({ name: 'Rina', email: `${atLimit}d` });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsOf(result.error)).toEqual({ email: SCHEMA_MESSAGES.emailTooLong });
    }
  });

  // Automate Story 1.7 — batas nama/email yang tidak diulang di test API (AC-4 sudah menguji '', 101, hilang).
  it('[P2] FR7: trims the name and email, and rejects a whitespace-only name or an email with inner spaces', () => {
    expect(registrationRequestSchema.parse({ name: '  Dimas Prasetyo  ', email: ' dimas@contoh.id ' })).toEqual({
      name: 'Dimas Prasetyo',
      email: 'dimas@contoh.id',
    });
    // 100 karakter setelah trim masih sah.
    expect(registrationRequestSchema.safeParse({ name: ` ${'a'.repeat(100)} `, email: 'a@b.id' }).success).toBe(true);

    const rejected: Array<[input: unknown, fields: Record<string, string>]> = [
      [{ name: '   ', email: 'a@b.id' }, { name: SCHEMA_MESSAGES.nameRequired }],
      [{ name: 'Rina', email: 'rina kusuma@contoh.id' }, { email: SCHEMA_MESSAGES.emailInvalid }],
      [{ name: 'Rina', email: '   ' }, { email: SCHEMA_MESSAGES.emailRequired }],
      [{ name: 42, email: 'a@b.id' }, { name: SCHEMA_MESSAGES.nameRequired }],
    ];
    for (const [input, fields] of rejected) {
      const result = registrationRequestSchema.safeParse(input);
      expect(result.success, JSON.stringify(input)).toBe(false);
      if (!result.success) expect(fieldErrorsOf(result.error)).toEqual(fields);
    }
  });

  it.each([
    ['an array', []],
    ['a JSON string', 'name=Rina'],
    ['null', null],
  ])('[P2] FR7: a body that is %s names both required fields instead of a body-level error', (_label, body) => {
    const result = registrationRequestSchema.safeParse(body);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrorsOf(result.error)).toEqual({ name: SCHEMA_MESSAGES.nameRequired, email: SCHEMA_MESSAGES.emailRequired });
    }
  });
});
