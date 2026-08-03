import { readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de los E2E de auditoría visual y de UI. Ver `e2e/README.md`
 * para el porqué de la arquitectura de tres capas y cómo levantar el entorno.
 *
 * Requiere el backend corriendo en local con `GOOGLE_OIDC_PROVIDER=fake`
 * (ver `amelia-intranet-back/.env.example`). `e2e/global-setup.ts` lo
 * comprueba antes de ejecutar nada y falla con instrucciones si no está.
 */

/**
 * El puerto del backend NO se hardcodea: se lee del mismo `.env` que consume
 * la app en el navegador (`VITE_API_BASE_URL`). En esta máquina, por ejemplo,
 * el contenedor publica el 8000 interno en el 8010 del host — con un valor
 * fijo aquí, los tests apuntarían a un puerto vacío y el fallo parecería "el
 * backend no está levantado".
 */
function apiBaseUrlFromEnvFile(): string | undefined {
  try {
    /* `process.cwd()` y no `__dirname`: el paquete es ESM (`"type": "module"`)
       y `__dirname` no existe ahí. Playwright se lanza siempre desde la raíz
       del proyecto, que es donde vive el `.env`. */
    const contents = readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
    const match = contents.match(/^\s*VITE_API_BASE_URL\s*=\s*(.+)$/m);
    return match?.[1]?.trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined; // sin `.env` local: se cae al default
  }
}

export const WEB_BASE_URL = process.env.E2E_WEB_BASE_URL ?? 'http://localhost:5173';
export const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? apiBaseUrlFromEnvFile() ?? 'http://localhost:8000';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',

  /* Los tests de una misma clase (visual, ui) son independientes entre sí,
     pero la sesión se comparte por worker — ver `e2e/fixtures/session.ts`. */
  fullyParallel: true,

  /* `POST /auth/login` está limitado a 10/minuto por IP en el backend
     (`@limiter.limit`). Cada worker hace un login por rol que necesite, así
     que con 2 workers y 4 roles el techo es 8 — por debajo del límite. Subir
     esto provoca 429 intermitentes que parecen fallos de la app y no lo son. */
  workers: 2,

  forbidOnly: true,
  retries: 0,

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: WEB_BASE_URL,
    /* En retina, un deviceScaleFactor de 2 cuadruplica el peso de cada
       baseline sin añadir información sobre el layout. */
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },

  /* Un solo motor (Chromium) a propósito: Firefox y WebKit rasterizan texto
     distinto, así que cada uno necesitaría su propio juego de baselines. Eso
     triplica el mantenimiento para detectar los mismos problemas de layout.
     Los tres proyectos son los tres puntos de ruptura del diseño. */
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 834, height: 1112 } },
    },
    {
      name: 'movil',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],

  expect: {
    /* Un umbral bajo pero no cero: el antialiasing de las fuentes varía un
       píxel entre ejecuciones incluso en la misma máquina. A cero, la suite
       parpadea y el equipo aprende a ignorarla — que es la única forma real
       de romper una suite de regresión visual. */
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.002,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },

  webServer: {
    command: 'pnpm dev',
    url: WEB_BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
