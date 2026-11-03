import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { configureApi } from './api/client';
import { router } from './router';
import './styles/tokens.css';
import './styles/base.css';
import './components/components.css';

configureApi({
  navigate: (to, options) => {
    void router.navigate(to, options);
  },
  currentPath: () => `${router.state.location.pathname}${router.state.location.search}`,
});

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Elemen #root tidak ditemukan.');
}

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
