import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base relativo ('./') faz os assets funcionarem tanto no deploy do GitHub Pages
  // (que fica em um subcaminho /nome-do-repo/) quanto ao rodar localmente.
  base: './',
  server: {
    host: true, // permite acessar o dev server por IP (ex.: testar no tablet via rede local)
    port: 5173,
  },
});
