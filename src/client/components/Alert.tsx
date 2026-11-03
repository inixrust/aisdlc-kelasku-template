import type { ReactNode, Ref } from 'react';
import { Icon } from './icons';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
  /** Bawaan: `alert` untuk danger, `status` untuk varian lain. */
  role?: 'alert' | 'status';
  /** Elemen alert bisa menerima fokus lewat `ref` (mis. ringkasan error). */
  ref?: Ref<HTMLDivElement>;
  tabIndex?: number;
  className?: string;
}

/** Alert sebaris tingkat halaman (DESIGN.md `alert`): ikon + teks, varian info/success/warning/danger. */
export function Alert({ variant, children, role, ref, tabIndex, className }: AlertProps) {
  return (
    <div
      ref={ref}
      role={role ?? (variant === 'danger' ? 'alert' : 'status')}
      tabIndex={tabIndex}
      className={['alert', `alert-${variant}`, className].filter(Boolean).join(' ')}
    >
      <Icon name={variant} />
      <div className="alert-body">{children}</div>
    </div>
  );
}
