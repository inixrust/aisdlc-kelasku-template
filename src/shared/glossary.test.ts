import { describe, expect, it } from 'vitest';
import { classStatusLabel, registrationStatusLabel } from './glossary.js';

describe('glossary (PRD §3)', () => {
  it('labels registration statuses with the exact glossary terms', () => {
    expect(registrationStatusLabel('registered')).toBe('Terdaftar');
    expect(registrationStatusLabel('waitlisted')).toBe('Daftar tunggu');
    expect(registrationStatusLabel('cancelled')).toBe('Dibatalkan');
  });

  it('labels class statuses with the exact glossary terms', () => {
    expect(classStatusLabel('open')).toBe('Dibuka');
    expect(classStatusLabel('full')).toBe('Penuh');
    expect(classStatusLabel('finished')).toBe('Selesai');
  });
});
