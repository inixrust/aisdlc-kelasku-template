import { useEffect, useState } from 'react';

export const TOAST_DURATION_MS = 5000;

/**
 * Toast konfirmasi sukses (EXPERIENCE.md › Toast): diumumkan lewat `aria-live="polite"`, hilang setelah
 * 5 detik, tidak mencuri fokus. Live region selalu ada; isinya berganti saat `message` berubah.
 * Error tidak pernah memakai toast.
 */
export function Toast({ message }: { message: string | null }) {
  const [visible, setVisible] = useState<string | null>(message);

  useEffect(() => {
    setVisible(message);
    if (message === null) return;
    const timer = setTimeout(() => setVisible(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {visible === null ? null : <div className="toast">{visible}</div>}
    </div>
  );
}
