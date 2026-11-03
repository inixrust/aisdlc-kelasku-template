import { useEffect, useRef } from 'react';
import { ERRORS } from '../../shared/errors.js';
import { Alert } from './Alert';

export interface FieldErrorItem {
  /** `id` input yang bersangkutan. */
  fieldId: string;
  message: string;
}

interface ErrorSummaryProps {
  errors: readonly FieldErrorItem[];
}

/**
 * Ringkasan error di atas formulir (EXPERIENCE.md › Formulir): `role="alert"`, menautkan ke setiap
 * kolom, dan menerima fokus setiap kali daftar error baru ditampilkan (identitas array berubah).
 */
export function ErrorSummary({ errors }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (errors.length > 0) ref.current?.focus();
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <Alert variant="danger" role="alert" ref={ref} tabIndex={-1} className="error-summary">
      <h2>{ERRORS.validation_error.message}</h2>
      <ul>
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              onClick={(event) => {
                // Tanpa perubahan hash: router tidak menganggapnya pindah rute.
                event.preventDefault();
                const input = document.getElementById(error.fieldId);
                input?.focus();
                input?.scrollIntoView({ block: 'center' });
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </Alert>
  );
}
