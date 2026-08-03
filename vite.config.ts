/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    /* Los E2E de Playwright viven en `e2e/` y también se llaman `*.spec.ts`.
       Sin esto, Vitest los recoge, los ejecuta en jsdom y revientan con
       "Playwright Test did not expect test.describe() to be called here" —
       cuatro ficheros en rojo que no tienen nada que ver con los tests
       unitarios. Playwright los ejecuta por su cuenta (`pnpm e2e`). */
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
});
