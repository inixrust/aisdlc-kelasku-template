import { useEffect } from 'react';

export function HomePage() {
  useEffect(() => {
    document.title = 'Kelasku';
  }, []);

  return (
    <main>
      <h1>Kelasku</h1>
      <p>Pendaftaran dan kehadiran kelas pelatihan.</p>
    </main>
  );
}
