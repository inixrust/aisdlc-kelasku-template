import { Link } from 'react-router';
import { getSession } from '../../api/auth';
import { useResource } from '../../api/useResource';
import { LoadState } from '../../components/LoadState';
import { PageLayout } from '../../components/PageLayout';

/**
 * Halaman Kelas `/admin/kelas` sementara. Memuat `GET /api/auth/session` sebagai sumber data pengganti
 * agar state muat/gagal/sesi habis sudah teruji; diganti `GET /api/admin/classes` di Story 1.9.
 * Tombol utama "Buat kelas" membuka `/admin/kelas/baru` (Story 1.6).
 */
export function ClassesPage() {
  const resource = useResource((signal) => getSession({ signal }));

  return (
    <PageLayout title="Kelas">
      <div>
        <Link to="/admin/kelas/baru" className="button button-primary">
          Buat kelas
        </Link>
      </div>
      <LoadState resource={resource}>{() => null}</LoadState>
    </PageLayout>
  );
}
