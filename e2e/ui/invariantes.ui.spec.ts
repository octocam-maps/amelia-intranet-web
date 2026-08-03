import { expect, test } from '../fixtures';
import { E2E_USERS } from '../fixtures/users';
import { SCREENS } from '../screens';
import { gotoScreen } from '../support/navigate';

/**
 * Invariantes que valen para TODA la app, no para una pantalla concreta. Se
 * comprueban sobre la aplicación montada de verdad, que es donde pueden
 * romperse sin que ningún test unitario se entere.
 */

test.describe('Estructura de la aplicación', () => {
  test.use({ role: 'empleado' });

  test('cada vista tiene exactamente un h1, y vive en el Topbar', async ({ authedPage }) => {
    /* Criterio ya establecido en el proyecto (`Topbar.tsx`,
       `Topbar.a11y.test.tsx`): el encabezado contextual vive en el Topbar y las
       páginas no lo repiten. Un test unitario solo puede comprobarlo pantalla a
       pantalla; esto lo recorre de verdad. */
    const paraEmpleado = SCREENS.filter((s) => s.roles.includes('empleado'));

    for (const screen of paraEmpleado) {
      await gotoScreen(authedPage, screen);
      await expect(
        authedPage.locator('h1'),
        `${screen.path} debería tener un único <h1> (el del Topbar)`,
      ).toHaveCount(1);
    }
  });

  test('el navbar no ofrece al empleado ningún acceso a Administración', async ({ authedPage }) => {
    /* "Ocultar ≠ proteger" corta en los dos sentidos: el backend rechaza al rol
       no autorizado, y además el navbar no debe ofrecerle la puerta. Esto último
       es lo que se comprueba aquí. */
    await expect(authedPage.locator('a[href^="/administracion"]')).toHaveCount(0);
  });
});

test.describe('Sesión y roles', () => {
  for (const user of Object.values(E2E_USERS)) {
    test.describe(`rol ${user.role}`, () => {
      test.use({ role: user.role });

      test('el backend asigna el rol esperado', async ({ session }) => {
        /* Verifica el fixture, no la app. Si el backend dejara de asignar el rol
           esperado, los tests de "vista de admin" seguirían pasando mientras
           auditan en realidad la vista de un empleado: un test verde sobre la
           pantalla equivocada es peor que uno rojo. */
        expect(session.user.role).toBe(user.role);
        expect(session.user.email).toBe(user.email);
      });
    });
  }
});
