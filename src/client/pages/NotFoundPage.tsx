import { useEffect } from 'react';
import { Link } from 'react-router';

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Halaman tidak ditemukan — Kelasku';
  }, []);

  return (
    <main>
      <h1>Halaman tidak ditemukan</h1>
      <p>Alamat yang Anda buka tidak ada di Kelasku.</p>
      <p>
        <Link to="/">Kembali ke beranda</Link>
      </p>
    </main>
  );
}
