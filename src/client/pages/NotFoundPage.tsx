import { Link } from 'react-router';
import { PageLayout } from '../components/PageLayout';

export function NotFoundPage() {
  return (
    <PageLayout title="Halaman tidak ditemukan">
      <p>Alamat yang Anda buka tidak ada di Kelasku.</p>
      <p>
        <Link to="/">Kembali ke beranda</Link>
      </p>
    </PageLayout>
  );
}
