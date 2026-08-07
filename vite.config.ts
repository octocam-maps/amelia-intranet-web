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
    // El producto es de España y su dominio horario razona en hora de pared
    // de Madrid (fichaje, jornada que cruza medianoche, informe del art. 34.9
    // ET). Sin fijar la zona, los tests de `time-clock/domain/wallClock` pasan
    // solo en una máquina configurada en Madrid: fallan en CI (UTC) y en
    // cualquier portátil fuera de la península.
    env: { TZ: 'Europe/Madrid' },
  },
});
