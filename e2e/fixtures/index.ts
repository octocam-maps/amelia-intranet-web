import { test as base, type Page } from '@playwright/test';
import { SESSION_AVAILABLE_ENV, SESSION_BLOCKED_REASON_ENV } from '../global-setup';
import { freezeTime } from '../support/determinism';
import { applySession, getSession, type E2ESession } from './session';
import type { E2ERole } from './users';

/**
 * `test` extendido del proyecto. Importa SIEMPRE desde aquí, no desde
 * `@playwright/test`, o los tests correrán sin sesión ni reloj congelado.
 *
 *   import { expect, test } from '../fixtures';
 *
 *   test.use({ role: 'administrador' });
 *   test('...', async ({ authedPage }) => { ... });
 */

interface E2EOptions {
  /** Rol con el que se inicia sesión. Sobreescribir con `test.use({ role })`. */
  role: E2ERole;
}

interface E2EFixtures {
  /** Página ya autenticada, con el reloj congelado y en el dashboard. */
  authedPage: Page;
  /** Datos de la sesión activa (útil para afirmar sobre el rol real). */
  session: E2ESession;
}

export const test = base.extend<E2EOptions & E2EFixtures>({
  role: ['empleado', { option: true }],

  session: async ({ role }, use, testInfo) => {
    /* Se salta, no falla: sin backend en modo `fake` no hay forma de tener
       sesión, y eso no es un defecto de la pantalla que este test audita. El
       motivo lo escribe `global-setup.ts` junto con las instrucciones. */
    testInfo.skip(
      process.env[SESSION_AVAILABLE_ENV] !== '1',
      `Requiere sesión y ${process.env[SESSION_BLOCKED_REASON_ENV] ?? 'el entorno no está listo'}. ` +
        'Ver el aviso del arranque para levantarlo.',
    );

    await use(await getSession(role, testInfo));
  },

  authedPage: async ({ page, context, session }, use) => {
    /* Orden importante: la intercepción del refresh y el reloj tienen que
       estar puestos ANTES de la primera carga, porque `useAuthBootstrap`
       dispara el refresh al montar `App.tsx`. */
    await applySession(context, session);
    await freezeTime(page);

    await page.goto('/');
    /* El `PageLoader` de `ProtectedRoute` se muestra hasta que el bootstrap
       resuelve. Esperar a que desaparezca es la señal fiable de "hay sesión",
       en vez de un timeout arbitrario. */
    await page.waitForLoadState('networkidle');

    await use(page);
  },
});

export { expect } from '@playwright/test';
export type { E2ERole };
