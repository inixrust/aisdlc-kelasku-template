import { CLASS_STATUS_LABELS, ELIGIBILITY_LABELS, REGISTRATION_STATUS_LABELS } from '../../shared/glossary.js';
import type { ClassStatus, EligibilityStatus, RegistrationStatus } from '../../shared/glossary.js';
import { Icon, type IconName } from './icons';

export type BadgeVariant = RegistrationStatus | ClassStatus | EligibilityStatus;

/** Nada warna badge; Daftar tunggu `warning` (bukan kegagalan), Penuh/Tidak mungkin layak `danger`. */
type BadgeTone = 'success' | 'warning' | 'danger' | 'muted' | 'info';

const BADGES: Record<BadgeVariant, { label: string; tone: BadgeTone; icon: IconName }> = {
  registered: { label: REGISTRATION_STATUS_LABELS.registered, tone: 'success', icon: 'check' },
  waitlisted: { label: REGISTRATION_STATUS_LABELS.waitlisted, tone: 'warning', icon: 'clock' },
  cancelled: { label: REGISTRATION_STATUS_LABELS.cancelled, tone: 'muted', icon: 'x' },
  // DESIGN.md tidak menetapkan badge Dibuka; memakai nada info (asumsi Story 1.6).
  open: { label: CLASS_STATUS_LABELS.open, tone: 'info', icon: 'circle' },
  full: { label: CLASS_STATUS_LABELS.full, tone: 'danger', icon: 'lock' },
  finished: { label: CLASS_STATUS_LABELS.finished, tone: 'muted', icon: 'flag' },
  eligible: { label: ELIGIBILITY_LABELS.eligible, tone: 'success', icon: 'check' },
  not_eligible: { label: ELIGIBILITY_LABELS.not_eligible, tone: 'muted', icon: 'minus' },
  cannot_be_eligible: { label: ELIGIBILITY_LABELS.cannot_be_eligible, tone: 'danger', icon: 'x' },
};

/**
 * Badge status (DESIGN.md `status-badge-*`, UX-DR4): ikon dekoratif + teks Glosarium, tidak interaktif.
 */
export function Badge({ variant }: { variant: BadgeVariant }) {
  const badge = BADGES[variant];
  return (
    <span className={`badge badge-${variant}`} data-tone={badge.tone}>
      <Icon name={badge.icon} />
      {badge.label}
    </span>
  );
}
