import { test } from '../fixtures';
import type { E2ERole } from '../fixtures/users';
import { auditMatrix, type Screen } from '../screens';
import { expectNoUiDefects } from '../support/expect-ui';
import { gotoScreen } from '../support/navigate';

/**
 * Barrido de invariantes de UI sobre TODAS las pantallas de la intranet, en los
 * tres anchos y con el rol que corresponde a cada una.
 *
 * Los tests se generan del catálogo (`e2e/screens.ts`) en vez de escribirse uno
 * a uno: así una pantalla nueva se audita en cuanto entra en el navbar, sin que
 * nadie tenga que acordarse de añadir su test. El guardia de que el catálogo no
 * se queda corto es `src/test/e2e-screen-catalog.test.ts`.
 *
 * Qué se comprueba en cada una: contraste real sobre el DOM renderizado,
 * overflow horizontal, texto recortado, tamaño de las áreas táctiles, jerarquía
 * de encabezados y las reglas de axe-core. Ver `support/ui-audit.ts`.
 */

/* Agrupado por rol: `test.use` fija el rol para todo el bloque y la sesión se
   reaprovecha entre sus tests. Agrupar importa — el backend limita
   /auth/login a 10 peticiones por minuto y por IP. */
const screensByRole = new Map<E2ERole, Screen[]>();
for (const { role, screen } of auditMatrix()) {
  screensByRole.set(role, [...(screensByRole.get(role) ?? []), screen]);
}

for (const [role, screens] of screensByRole) {
  test.describe(`Pantallas del rol ${role}`, () => {
    test.use({ role });

    for (const screen of screens) {
      test(`${screen.path} (${screen.title}) no tiene defectos de UI bloqueantes`, async ({
        authedPage,
      }, testInfo) => {
        await gotoScreen(authedPage, screen);
        await expectNoUiDefects(authedPage, testInfo);
      });
    }
  });
}
