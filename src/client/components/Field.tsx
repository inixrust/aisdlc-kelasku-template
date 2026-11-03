import type { InputHTMLAttributes, Ref } from 'react';
import { Icon } from './icons';

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'aria-invalid' | 'aria-describedby'> {
  id: string;
  label: string;
  /** Menambah "(wajib)" di label (bukan hanya tanda bintang). */
  required?: boolean;
  error?: string | undefined;
  /** Teks bantuan di bawah input. */
  hint?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Label terlihat di atas input; pesan error di bawahnya dengan ikon, dikaitkan lewat
 * `aria-describedby`, dan input diberi `aria-invalid="true"` (EXPERIENCE.md › Accessibility Floor).
 */
export function Field({ id, label, required = false, error, hint, ref, className, ...inputProps }: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint === undefined ? null : hintId, error === undefined ? null : errorId].filter(Boolean).join(' ');

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
        {required ? ' (wajib)' : null}
      </label>
      {hint === undefined ? null : (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
      <input
        {...inputProps}
        ref={ref}
        id={id}
        className={['input', className].filter(Boolean).join(' ')}
        aria-invalid={error === undefined ? undefined : true}
        aria-describedby={describedBy === '' ? undefined : describedBy}
        aria-required={required || undefined}
      />
      {error === undefined ? null : (
        <p id={errorId} className="field-error">
          <Icon name="danger" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
