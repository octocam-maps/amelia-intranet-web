import { request } from '@playwright/test';
import { API_BASE_URL } from '../playwright.config';
import { buildFakeIdToken, E2E_USERS } from './fixtures/users';
import { resetFindingsLog } from './support/findings-log';

/**
 * Diagnostica el entorno ANTES de ejecutar tests y publica el resultado en
 * `process.env.E2E_SESSION_AVAILABLE`, que los workers heredan.
 *
 * No aborta la ejecución a propósito. Los tests de la pantalla de login no
 * necesitan sesión, así que quien solo quiera auditar esa pantalla no tiene
 * por qué levantar el backend en modo `fake`. Los que sí la necesitan se
 * SALTAN con el motivo escrito, en vez de fallar veinte veces con "elemento no
 * encontrado" — un error que parece un bug de la aplicación y no lo es.
 */

export const SESSION_AVAILABLE_ENV = 'E2E_SESSION_AVAILABLE';
export const SESSION_BLOCKED_REASON_ENV = 'E2E_SESSION_BLOCKED_REASON';

const COMO_LEVANTARLO = `
Para habilitar los tests con sesión:
  1. En amelia-intranet-back/.env añade:  GOOGLE_OIDC_PROVIDER=fake
     (deja REFRESH_TOKEN_COOKIE_SECURE=false; con Secure=true el backend
      aborta el arranque a propósito)
  2. Reinicia el backend:
       docker compose -f docker-compose.local.yaml --profile local restart amelia-intranet-backend
  3. Solo para los roles socio y externo, aplica la semilla:
       psql "postgresql://postgres:postgres@localhost:5436/postgres" -f e2e/seed/e2e-users.sql
`;

export default async function globalSetup(): Promise<void> {
  /* La bitácora es de ESTA ejecución: si se acumulara, el resumen mezclaría
     hallazgos ya arreglados con los actuales. */
  resetFindingsLog();

  const api = await request.newContext({ baseURL: API_BASE_URL });
  let blockedReason: string | null = null;

  try {
    const health = await api.get('/health', { timeout: 5_000 }).catch(() => null);

    if (!health?.ok()) {
      blockedReason =
        `el backend no responde en ${API_BASE_URL}` +
        (health ? ` (devolvió ${health.status()})` : '');
    } else {
      /* Sonda con el administrador porque ya viene sembrado en `init.sql`: así
         un 401 solo puede significar "el verificador falso no está activo", y
         no se confunde con "ese usuario no existe". */
      const probe = await api.post('/auth/login', {
        data: { id_token: buildFakeIdToken(E2E_USERS.administrador) },
        failOnStatusCode: false,
      });

      if (probe.status() === 401) {
        blockedReason =
          'el backend verifica las firmas de Google de verdad ' +
          '(GOOGLE_OIDC_PROVIDER != fake), y el login real de Google no se ' +
          'puede automatizar';
      } else if (!probe.ok()) {
        blockedReason = `la sonda de login devolvió ${probe.status()}: ${await probe.text()}`;
      }
    }
  } finally {
    await api.dispose();
  }

  if (blockedReason) {
    process.env[SESSION_AVAILABLE_ENV] = '0';
    process.env[SESSION_BLOCKED_REASON_ENV] = blockedReason;
    console.warn(
      `\n⚠  Tests con sesión DESACTIVADOS: ${blockedReason}.\n` +
        `   Se ejecutarán solo los que no requieren login.\n${COMO_LEVANTARLO}`,
    );
    return;
  }

  process.env[SESSION_AVAILABLE_ENV] = '1';
  console.log(`✓ Backend en ${API_BASE_URL} aceptando id_tokens sintéticos.`);
}
