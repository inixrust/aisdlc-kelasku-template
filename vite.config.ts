import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Sama dengan `readPort` di server: PORT kosong berarti 3000.
const apiPort = process.env.PORT?.trim() || '3000';

export default defineConfig(({ command }) => {
  // `vite build` selalu menghasilkan bundle produksi, juga saat dipanggil dengan NODE_ENV=test (e2e, AD-14).
  if (command === 'build') process.env.NODE_ENV = 'production';

  return {
    root: fileURLToPath(new URL('./src/client', import.meta.url)),
    plugins: [react()],
    build: {
      outDir: fileURLToPath(new URL('./dist/client', import.meta.url)),
      emptyOutDir: true,
    },
    server: {
      proxy: {
        '/api': `http://127.0.0.1:${apiPort}`,
      },
    },
  };
});
