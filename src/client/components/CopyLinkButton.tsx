import { useEffect, useState } from 'react';

export const COPIED_DURATION_MS = 3000;

type CopyState = 'idle' | 'copied' | 'failed';

interface CopyLinkButtonProps {
  url: string;
  /** `id` elemen teks URL; dipilih otomatis bila clipboard ditolak. */
  textId: string;
}

/**
 * Tombol "Salin tautan" (EXPERIENCE.md › Tombol salin tautan, FR6): menyalin URL lengkap, label menjadi
 * "Tautan disalin" selama 3 detik dan diumumkan lewat `aria-live="polite"`. Bila clipboard ditolak,
 * teks URL dipilih agar bisa disalin manual.
 */
export function CopyLinkButton({ url, textId }: CopyLinkButtonProps) {
  const [state, setState] = useState<CopyState>('idle');

  useEffect(() => {
    if (state !== 'copied') return;
    const timer = setTimeout(() => setState('idle'), COPIED_DURATION_MS);
    return () => clearTimeout(timer);
  }, [state]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
    } catch {
      const text = document.getElementById(textId);
      const selection = window.getSelection();
      if (text !== null && selection !== null) selection.selectAllChildren(text);
      setState('failed');
    }
  };

  return (
    <span className="copy-link" aria-live="polite">
      <button type="button" className="button button-secondary" onClick={handleCopy}>
        {state === 'copied' ? 'Tautan disalin' : 'Salin tautan'}
      </button>
      {state === 'failed' ? <span className="copy-link-failed">Tautan belum tersalin. Salin tautan di atas secara manual.</span> : null}
    </span>
  );
}
