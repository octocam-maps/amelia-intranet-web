import type { APIRequestContext, BrowserContext } from '@playwright/test';
import { request } from '@playwright/test';
import { API_BASE_URL } from '../../playwright.config';
import { buildFakeIdToken, E2E_USERS, type E2ERole, type E2EUser } from './users';

/**
 * Sesión autenticada para los E2E, sin pasar por el login real de Google.
 *
 * ## Por qué no se usa `storageState`
 *
 * El patrón habitual de Playwright (loguearse una vez, guardar el
 * `storageState` y reutilizarlo en todos los tests) NO funciona contra este
 * backend, y el fallo sería desconcertante: los primeros tests pasarían y el
 * resto daría 401 sin motivo aparente.
 *
 * El refresh token rota en cada uso y hay detección de reuso estilo OWASP
 * (`RefreshSessionUseCase`): presentar un `jti` ya rotado se interpreta como
 * robo de token y **revoca la familia entera**. Dos contextos partiendo del
 * mismo `storageState` hacen exactamente eso — el segundo se autodenuncia y
 * mata la sesión de todos.
 *
 * ## Qué se hace en su lugar
 *
 * 1. Un `POST /auth/login` REAL por rol y por worker, con el id_token
 *    sintético. Recorre el caso de uso completo: alta/vinculación del usuario,
 *    transición `invited` -> `active`, emisión del JWT firmado.
 * 2. En el navegador se intercepta ÚNICAMENTE `POST /auth/refresh`, que se
 *    responde con el access token de ese login. Así la app arranca
 *    autenticada sin consumir la cookie rotatoria.
 *
 * Todo lo demás —`/auth/me`, y cada endpoint de negocio— va contra el
 * backend real con un Bearer real. Lo único simulado es el mecanismo de
 * rotación de sesión, que no es lo que estos tests auditan.
 *
 * El login es perezoso y cacheado por worker por el rate limit del backend
 * (10 logins/minuto por IP).
 */

export interface E2ESession {
  accessToken: string;
  expiresIn: number;
  user: { id: string; email: string; full_name: string; role: string };
}

const sessionCache = new Map<string, Promise<E2ESession>>();

async function login(apiContext: APIRequestContext, user: E2EUser): Promise<E2ESession> {
  const response = await apiContext.post('/auth/login', {
    data: { id_token: buildFakeIdToken(user) },
  });

  if (!response.ok()) {
    const body = await response.text();

    if (response.status() === 401) {
      throw new Error(
        `Login E2E rechazado (401) para ${user.email}.\n` +
          `El backend NO está aceptando id_tokens sintéticos. Arráncalo con ` +
          `GOOGLE_OIDC_PROVIDER=fake en su .env.\nRespuesta: ${body}`,
      );
    }
    if (response.status() === 403) {
      throw new Error(
        `Login E2E rechazado (403) para ${user.email} (rol ${user.role}).\n` +
          `Ese usuario no existe ni tiene invitación pendiente. Aplica la ` +
          `semilla: psql ... -f e2e/seed/e2e-users.sql\nRespuesta: ${body}`,
      );
    }
    if (response.status() === 429) {
      throw new Error(
        `Rate limit del login alcanzado (429). El backend limita ` +
          `/auth/login a 10/minuto por IP. Baja \`workers\` en ` +
          `playwright.config.ts o espera un minuto.\nRespuesta: ${body}`,
      );
    }
    throw new Error(`Login E2E falló (${response.status()}) para ${user.email}: ${body}`);
  }

  const body = await response.json();
  return {
    accessToken: body.access_token,
    expiresIn: body.expires_in,
    user: body.user,
  };
}

/**
 * Sesión del rol, cacheada por worker.
 *
 * La clave lleva el `workerIndex` porque cada worker es un proceso distinto
 * con su propio módulo cargado: la caché no se comparte entre ellos, y
 * meterlo en la clave lo hace explícito en lugar de accidental.
 */
export async function getSession(
  role: E2ERole,
  worker: { workerIndex: number },
): Promise<E2ESession> {
  const key = `${worker.workerIndex}:${role}`;
  const cached = sessionCache.get(key);
  if (cached) return cached;

  const pending = (async () => {
    const apiContext = await request.newContext({ baseURL: API_BASE_URL });
    try {
      return await login(apiContext, E2E_USERS[role]);
    } finally {
      await apiContext.dispose();
    }
  })();

  sessionCache.set(key, pending);
  return pending;
}

/**
 * Deja el contexto del navegador listo para arrancar autenticado.
 *
 * Se llama ANTES del primer `goto`: `useAuthBootstrap` dispara el refresh en
 * el montaje de `App.tsx`, así que la ruta tiene que estar puesta antes de
 * que cargue la página.
 */
export async function applySession(context: BrowserContext, session: E2ESession): Promise<void> {
  await context.route('**/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: session.accessToken,
        token_type: 'bearer',
        expires_in: session.expiresIn,
      }),
    });
  });
}
