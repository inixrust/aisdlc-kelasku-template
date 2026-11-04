/**
 * Label status Indonesia (AD-10, AD-13), persis istilah Glosarium PRD §3.
 * Nilai yang disimpan/dikirim API memakai kunci Inggris; teks tampilan hanya dari berkas ini.
 */

export type RegistrationStatus = 'registered' | 'waitlisted' | 'cancelled';
export type ClassStatus = 'open' | 'full' | 'finished';
export type EligibilityStatus = 'eligible' | 'not_eligible' | 'cannot_be_eligible';

export const REGISTRATION_STATUS_LABELS = {
  registered: 'Terdaftar',
  waitlisted: 'Daftar tunggu',
  cancelled: 'Dibatalkan',
} as const satisfies Record<RegistrationStatus, string>;

export const CLASS_STATUS_LABELS = {
  open: 'Dibuka',
  full: 'Penuh',
  finished: 'Selesai',
} as const satisfies Record<ClassStatus, string>;

export const ELIGIBILITY_LABELS = {
  eligible: 'Layak',
  not_eligible: 'Belum layak',
  cannot_be_eligible: 'Tidak mungkin layak',
} as const satisfies Record<EligibilityStatus, string>;

export function registrationStatusLabel(status: RegistrationStatus): string {
  return REGISTRATION_STATUS_LABELS[status];
}

export function classStatusLabel(status: ClassStatus): string {
  return CLASS_STATUS_LABELS[status];
}

export function eligibilityLabel(status: EligibilityStatus): string {
  return ELIGIBILITY_LABELS[status];
}
