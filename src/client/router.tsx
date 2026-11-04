import { createBrowserRouter, Navigate } from 'react-router';
import { AdminLayout } from './components/AdminLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ClassPage } from './pages/admin/ClassPage';
import { ClassesPage } from './pages/admin/ClassesPage';
import { CreateClassPage } from './pages/admin/CreateClassPage';
import { LoginPage } from './pages/admin/LoginPage';

// Rute IA EXPERIENCE.md ditambahkan oleh story pemilik halamannya. Data diambil lewat `src/client/api`
// tanpa loader/action (AD-13).
export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/admin/masuk', element: <LoginPage /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      // FR-17 (Sesi hari ini) belum dibangun: beranda admin mengalihkan ke Kelas.
      { index: true, element: <Navigate to="/admin/kelas" replace /> },
      { path: 'kelas', element: <ClassesPage /> },
      { path: 'kelas/baru', element: <CreateClassPage /> },
      { path: 'kelas/:id', element: <ClassPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
