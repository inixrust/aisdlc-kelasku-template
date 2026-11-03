import { createContext, type MouseEvent, type ReactNode, type RefObject, use, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

export const APP_NAME = 'Kelasku';
export const MAIN_CONTENT_ID = 'main-content';

/** Benar di dalam `AdminLayout`: skip link, `header`/`nav`, dan `main` sudah disediakan top bar admin. */
export const AdminChromeContext = createContext(false);

/** Kunci lokasi terakhir yang dilihat `PageLayout`; null sampai halaman pertama tampil. */
let lastLocationKey: string | null = null;

/**
 * Fokus ke `<h1>` setelah pindah rute, tetapi tidak pada muat pertama
 * (EXPERIENCE.md › Accessibility Floor).
 */
function useFocusHeadingOnRouteChange(heading: RefObject<HTMLHeadingElement | null>): void {
  const { key } = useLocation();
  useEffect(() => {
    if (lastLocationKey === null) {
      lastLocationKey = key;
      return;
    }
    if (lastLocationKey === key) return;
    lastLocationKey = key;
    heading.current?.focus();
  }, [key, heading]);
}

export function SkipLink() {
  return (
    <a className="skip-link" href={`#${MAIN_CONTENT_ID}`} onClick={focusMain}>
      Lewati ke konten utama
    </a>
  );
}

function focusMain(event: MouseEvent<HTMLAnchorElement>): void {
  // Tanpa perubahan hash: router tidak menganggapnya pindah rute.
  event.preventDefault();
  document.getElementById(MAIN_CONTENT_ID)?.focus();
}

interface PageLayoutProps {
  /** Teks `<h1>`; juga `<title>` "{title} — Kelasku". */
  title: string;
  /** Ganti `<title>` dokumen bila berbeda dari pola (beranda: "Kelasku"). */
  documentTitle?: string;
  /** Lebar kolom sempit (formulir Masuk, halaman peserta). */
  narrow?: boolean;
  children?: ReactNode;
}

/**
 * Kerangka setiap halaman (AD-13, UX-DR2): satu `<h1>`, skip link "Lewati ke konten utama" di urutan
 * fokus pertama, `<title>` "{Halaman} — Kelasku", fokus ke `<h1>` saat rute berubah. Halaman non-admin
 * mendapat `header` (teks "Kelasku") + `main` tanpa navigasi global; di dalam `AdminLayout` hanya isi.
 */
export function PageLayout({ title, documentTitle, narrow = false, children }: PageLayoutProps) {
  const inAdmin = use(AdminChromeContext);
  const heading = useRef<HTMLHeadingElement>(null);
  useFocusHeadingOnRouteChange(heading);

  const fullTitle = documentTitle ?? `${title} — ${APP_NAME}`;
  useEffect(() => {
    document.title = fullTitle;
  }, [fullTitle]);

  const content = (
    <div className={narrow ? 'page-content page-narrow' : 'page-content'}>
      <h1 ref={heading} tabIndex={-1}>
        {title}
      </h1>
      {children}
    </div>
  );

  if (inAdmin) return content;

  return (
    <>
      <SkipLink />
      <header className="site-header">
        <p className="app-name">{APP_NAME}</p>
      </header>
      <main id={MAIN_CONTENT_ID} className="page-main" tabIndex={-1}>
        {content}
      </main>
    </>
  );
}
