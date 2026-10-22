/**
 * vite.config.js
 * Vite config: React plugin and dev proxy for backend API routes.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/monitor': 'http://localhost:3000',
      '/alerts': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
    },
  },
});
