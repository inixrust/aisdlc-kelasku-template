import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { ERRORS } from '../../../shared/errors.js';
import { formatSessionDate } from '../../../shared/format.js';
import { getClass } from '../../api/classes';
import { useResource } from '../../api/useResource';
import { Alert } from '../../components/Alert';
import { Badge } from '../../components/Badge';
import { CopyLinkButton } from '../../components/CopyLinkButton';
import { LoadState } from '../../components/LoadState';
import { PageLayout } from '../../components/PageLayout';
import { Toast } from '../../components/Toast';

export const CLASS_SAVED_TOAST = 'Kelas tersimpan';

/** State navigasi ke halaman kelas (mis. toast setelah simpan). */
export interface ClassPageLocationState {
  toast?: string;
}

const REGISTRATION_LINK_ID = 'registration-link';

/**
 * Halaman kelas admin `/admin/kelas/:id` (FR5, FR6): kepala kelas (judul, badge status dari server,
 * kuota, tanggal sesi + penanda "Hari ini", tautan pendaftaran + "Salin tautan"). Daftar pendaftaran
 * menyusul di Story 1.10.
 */
export function ClassPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  // Toast dibaca sekali lalu state riwayat dikosongkan, agar muat ulang halaman tidak menampilkannya lagi.
  const [toast] = useState(() => (location.state as ClassPageLocationState | null)?.toast ?? null);
  useEffect(() => {
    if (location.state !== null) void navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate]);
  const resource = useResource((signal) => getClass(id, { signal }), [id]);

  if (resource.state === 'error' && resource.error.code === 'class_not_found') {
    return (
      <PageLayout title="Kelas tidak ditemukan">
        <Alert variant="danger">
          <p>{ERRORS.class_not_found.message}</p>
          <p>
            <Link to="/admin/kelas">Kembali ke daftar kelas</Link>
          </p>
        </Alert>
      </PageLayout>
    );
  }

  const title = resource.state === 'ok' ? resource.data.title : 'Kelas';

  return (
    <PageLayout title={title}>
      <Toast message={toast} />
      <LoadState resource={resource}>
        {(data) => {
          // URL tautan dibangun klien dari origin + `/daftar/` + `publicCode` (spine, Rute UI).
          const registrationUrl = `${window.location.origin}/daftar/${data.publicCode}`;
          return (
            <>
              <div className="class-header">
                <p className="class-meta">
                  <Badge variant={data.status} />
                  <span>Kuota: {data.quota}</span>
                </p>
              </div>

              <section className="section" aria-labelledby="class-sessions-heading">
                <h2 id="class-sessions-heading">Tanggal sesi</h2>
                <ul className="session-list">
                  {data.sessionDates.map((date) => (
                    <li key={date}>
                      <span>{formatSessionDate(date)}</span>
                      {date === data.today ? <span className="today-marker">Hari ini</span> : null}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="section" aria-labelledby="registration-link-heading">
                <h2 id="registration-link-heading">Tautan pendaftaran</h2>
                <p id={REGISTRATION_LINK_ID} className="registration-link">
                  {registrationUrl}
                </p>
                <div>
                  <CopyLinkButton url={registrationUrl} textId={REGISTRATION_LINK_ID} />
                </div>
              </section>
            </>
          );
        }}
      </LoadState>
    </PageLayout>
  );
}
