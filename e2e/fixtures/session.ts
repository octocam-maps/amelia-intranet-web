import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
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

interface CachedSession extends E2ESession {
  /** Marca de tiempo del login, para poder descartar tokens caducados. */
  obtainedAtMs: number;
}

const sessionCache = new Map<string, Promise<E2ESession>>();

/**
 * Caché EN DISCO, compartida entre workers y proyectos.
 *
 * Una caché solo en memoria no basta, y el motivo se paga caro: Playwright
 * arranca un proceso worker nuevo por proyecto (aquí, tres anchos), así que el
 * `Map` del módulo se pierde y cada worker rehace el login de cada rol. Medido:
 * 30 logins en una ejecución con 5 roles, 3 proyectos y 2 workers, contra un
 * rate limit de 10/minuto — 29 respuestas 429 y esperas de un minuto en medio
 * de la suite.
 *
 * Lo que se comparte es el ACCESS TOKEN, no la cookie de refresh: es un JWT sin
 * estado, válido 15 minutos, y usarlo desde varios workers a la vez no dispara
 * ninguna rotación ni detección de reuso.
 */
const SESSION_DIR = 'e2e/.auth';
/* Margen de 3 minutos: un token que caduca a mitad de un test produce un 401
   desconcertante en medio de una aserción de UI. */
const TOKEN_SAFETY_MARGIN_MS = 3 * 60 * 1000;

function cachePath(role: E2ERole): string {
  return path.resolve(process.cwd(), SESSION_DIR, `session-${role}.json`);
}

function readCachedSession(role: E2ERole): E2ESession | null {
  try {
    const cached = JSON.parse(readFileSync(cachePath(role), 'utf-8')) as CachedSession;
    const expiresAtMs = cached.obtainedAtMs + cached.expiresIn * 1000;
    if (expiresAtMs - Date.now() < TOKEN_SAFETY_MARGIN_MS) return null;
    return { accessToken: cached.accessToken, expiresIn: cached.expiresIn, user: cached.user };
  } catch {
    return null; // no existe, ilegible o caducada
  }
}

function writeCachedSession(role: E2ERole, session: E2ESession): void {
  try {
    mkdirSync(path.resolve(process.cwd(), SESSION_DIR), { recursive: true });
    const payload: CachedSession = { ...session, obtainedAtMs: Date.now() };
    /* Escritura atómica: dos workers pueden guardar el mismo rol a la vez, y
       un lector no debe encontrarse medio JSON. */
    const target = cachePath(role);
    const temp = `${target}.${process.pid}.tmp`;
    writeFileSync(temp, JSON.stringify(payload), 'utf-8');
    renameSync(temp, target);
  } catch {
    /* Si no se puede escribir, el único coste es un login extra. */
  }
}

/**
 * `POST /auth/login` está limitado a 10/minuto por IP. Con cinco roles y dos
 * workers el techo teórico es 10 — justo en el borde. Antes que bajar a un
 * worker (y duplicar el tiempo de la suite) o debilitar el rate limit del
 * backend (que protege producción), se espera y se reintenta UNA vez: el 429 es
 * una condición conocida del entorno, no un fallo de la aplicación.
 */
const RATE_LIMIT_WINDOW_MS = 61_000;

async function login(
  apiContext: APIRequestContext,
  user: E2EUser,
  { allowRetryOnRateLimit = true } = {},
): Promise<E2ESession> {
  const response = await apiContext.post('/auth/login', {
    data: { id_token: buildFakeIdToken(user) },
    failOnStatusCode: false,
  });

  if (response.status() === 429 && allowRetryOnRateLimit) {
    console.warn(
      `⏳ Rate limit del login alcanzado para ${user.email}. Esperando ` +
        `${Math.round(RATE_LIMIT_WINDOW_MS / 1000)}s y reintentando una vez.`,
    );
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WINDOW_MS));
    return login(apiContext, user, { allowRetryOnRateLimit: false });
  }

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
        `Rate limit del login (429) persistente tras esperar y reintentar. ` +
          `El backend limita /auth/login a 10/minuto por IP; baja \`workers\` ` +
          `en playwright.config.ts.\nRespuesta: ${body}`,
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
  const inMemory = sessionCache.get(key);
  if (inMemory) return inMemory;

  const pending = (async () => {
    const fromDisk = readCachedSession(role);
    if (fromDisk) return fromDisk;

    const apiContext = await request.newContext({ baseURL: API_BASE_URL });
    try {
      const session = await login(apiContext, E2E_USERS[role]);
      writeCachedSession(role, session);
      return session;
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
