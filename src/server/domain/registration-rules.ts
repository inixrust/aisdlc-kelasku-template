/**
 * Aturan pendaftaran murni (R1, R3, AD-5, AD-6). Tanpa I/O dan tanpa jam.
 */
import type { RegistrationStatus } from '../../shared/glossary.js';

/**
 * R1 + R3: Terdaftar hanya bila masih ada kursi (`registeredCount < quota`) **dan** antrean kosong;
 * selain itu pendaftar masuk ekor Daftar tunggu.
 */
export function decideRegistration(input: {
  registeredCount: number;
  quota: number;
  waitlistLength: number;
}): Extract<RegistrationStatus, 'registered' | 'waitlisted'> {
  return input.registeredCount < input.quota && input.waitlistLength === 0 ? 'registered' : 'waitlisted';
}

/** R3: posisi antrean 1-based menurut `registrations.id` naik, apa pun urutan `waitlistIds`. */
export function waitlistPosition(waitlistIds: readonly number[], registrationId: number): number {
  if (!waitlistIds.includes(registrationId)) {
    throw new Error(`waitlistPosition: id ${registrationId} tidak ada di antrean.`);
  }
  return waitlistIds.filter((id) => id < registrationId).length + 1;
}
