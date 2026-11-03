import type { ReactNode } from 'react';
import type { Resource } from '../api/useResource';
import { Alert } from './Alert';

export const LOAD_FAILED_MESSAGE = 'Tidak dapat memuat data. Periksa koneksi lalu coba lagi.';

interface LoadStateProps<T> {
  resource: Resource<T>;
  children: (data: T) => ReactNode;
}

/**
 * Keadaan muat data di area konten (EXPERIENCE.md › State Patterns): "Memuat…" setelah 300 ms,
 * alert danger + "Coba lagi" bila gagal, lalu isi halaman.
 */
export function LoadState<T>({ resource, children }: LoadStateProps<T>) {
  switch (resource.state) {
    case 'loading':
      return resource.showLoading ? <p role="status">Memuat…</p> : null;
    case 'error':
      return (
        <Alert variant="danger">
          <p>{LOAD_FAILED_MESSAGE}</p>
          <div className="alert-actions">
            <button type="button" className="button button-secondary" onClick={resource.retry}>
              Coba lagi
            </button>
          </div>
        </Alert>
      );
    case 'ok':
      return <>{children(resource.data)}</>;
  }
}
