import { useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { getSession, logout } from '../api/auth';
import { ApiError, LOGIN_PATH, loginPath } from '../api/client';
import { useResource } from '../api/useResource';
import { Alert } from './Alert';
import { LoadState } from './LoadState';
import { AdminChromeContext, APP_NAME, MAIN_CONTENT_ID, PageLayout, SkipLink } from './PageLayout';

/**
 * Kerangka semua rute `/admin/*` (AD-13, FR-1): cek `GET /api/auth/session` dulu; anak tidak dirender
 * sebelum 200. Belum masuk (401) → Masuk dengan `next`, tanpa alert sesi habis.
 * Top bar 48 px: "Kelasku", tautan "Kelas", email admin, tombol "Keluar".
 */
export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useResource((signal) => getSession({ on401: 'throw', signal }));
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  if (session.state === 'error' && session.error.code === 'unauthorized') {
    return <Navigate to={loginPath(`${location.pathname}${location.search}`)} replace />;
  }

  if (session.state === 'loading') {
    return session.showLoading ? <p role="status">Memuat…</p> : null;
  }

  if (session.state === 'error') {
    return (
      <PageLayout title="Panel admin">
        <LoadState resource={session}>{() => null}</LoadState>
      </PageLayout>
    );
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      await navigate(LOGIN_PATH);
    } catch (error) {
      setLogoutError(error instanceof ApiError ? error.message : new ApiError('unexpected_response').message);
      setLoggingOut(false);
    }
  };

  return (
    <AdminChromeContext value={true}>
      <SkipLink />
      <header className="top-bar">
        <nav className="top-bar-nav" aria-label="Navigasi admin">
          <span className="app-name">{APP_NAME}</span>
          <ul className="top-bar-links">
            <li>
              <NavLink to="/admin/kelas" className="top-bar-link">
                Kelas
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="top-bar-account">
          <span className="top-bar-email">{session.data.email}</span>
          <button type="button" className="button button-secondary" onClick={handleLogout} disabled={loggingOut}>
            Keluar
          </button>
        </div>
      </header>
      <main id={MAIN_CONTENT_ID} className="page-main" tabIndex={-1}>
        <div className="page-content">
          {logoutError === null ? null : <Alert variant="danger">{logoutError}</Alert>}
          <Outlet />
        </div>
      </main>
    </AdminChromeContext>
  );
}
