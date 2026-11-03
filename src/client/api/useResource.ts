import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './client.js';

/** "Memuat…" baru tampil bila request lebih lama dari ini (EXPERIENCE.md › State Patterns). */
export const LOADING_DELAY_MS = 300;

export type Resource<T> =
  | { state: 'loading'; data: undefined; error: undefined; showLoading: boolean; retry: () => void }
  | { state: 'ok'; data: T; error: undefined; showLoading: false; retry: () => void }
  | { state: 'error'; data: undefined; error: ApiError; showLoading: false; retry: () => void };

type Snapshot<T> = { state: 'loading' } | { state: 'ok'; data: T } | { state: 'error'; error: ApiError };

/**
 * Muat data sekali saat komponen tampil (tanpa loader React Router, AD-13).
 * `load` dipanggil ulang saat `deps` berubah atau `retry()`; hasil request lama diabaikan.
 */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[] = []): Resource<T> {
  const [attempt, setAttempt] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({ state: 'loading' });
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setSnapshot({ state: 'loading' });
    setShowLoading(false);
    const timer = setTimeout(() => {
      if (active) setShowLoading(true);
    }, LOADING_DELAY_MS);

    load(controller.signal).then(
      (data) => {
        if (active) setSnapshot({ state: 'ok', data });
      },
      (error: unknown) => {
        if (!active) return;
        setSnapshot({ state: 'error', error: error instanceof ApiError ? error : new ApiError('unexpected_response', { cause: error }) });
      },
    ).finally(() => clearTimeout(timer));

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `load` sengaja tidak jadi dependensi; pemanggil memakai `deps`.
  }, [attempt, ...deps]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  switch (snapshot.state) {
    case 'loading':
      return { state: 'loading', data: undefined, error: undefined, showLoading, retry };
    case 'ok':
      return { state: 'ok', data: snapshot.data, error: undefined, showLoading: false, retry };
    case 'error':
      return { state: 'error', data: undefined, error: snapshot.error, showLoading: false, retry };
  }
}
