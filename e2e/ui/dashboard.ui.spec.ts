import { expect, test } from '../fixtures';
import { settleForScreenshot } from '../support/determinism';
import { expectNoUiDefects } from '../support/expect-ui';

/**
 * El dashboard cambia MUCHO según el rol: el administrador ve KPIs, filtros y
 * bandejas de aprobación que un empleado no tiene. Auditar un solo rol dejaría
 * la mitad de la superficie sin mirar.
 */

test.describe('Dashboard del empleado', () => {
  test.use({ role: 'empleado' });

  test('no tiene defectos de UI bloqueantes', async ({ authedPage }, testInfo) => {
    await expect(authedPage.getByRole('heading', { level: 1 })).toBeVisible();
    await settleForScreenshot(authedPage);
    await expectNoUiDefects(authedPage, testInfo);
  });

  test('hay un único h1 en la vista, y vive en el Topbar', async ({ authedPage }) => {
    /* Criterio ya establecido en el proyecto (ver `Topbar.tsx` y
       `Topbar.a11y.test.tsx`): el encabezado contextual vive en el Topbar y
       las páginas no lo repiten. Aquí se comprueba sobre la app REAL montada,
       que es donde puede volver a colarse un h1 de página. */
    await expect(authedPage.locator('h1')).toHaveCount(1);
  });
});

test.describe('Dashboard del administrador', () => {
  test.use({ role: 'administrador' });

  test('no tiene defectos de UI bloqueantes', async ({ authedPage }, testInfo) => {
    await expect(authedPage.getByRole('heading', { level: 1 })).toBeVisible();
    await settleForScreenshot(authedPage);
    await expectNoUiDefects(authedPage, testInfo);
  });

  test('la sesión es realmente la del rol administrador', async ({ session }) => {
    /* Verifica el fixture, no la app: si el backend dejara de asignar el rol
       esperado, los tests de "vista de admin" seguirían pasando mientras
       auditan en realidad la vista de un empleado. Un test verde sobre la
       pantalla equivocada es peor que un test rojo. */
    expect(session.user.role).toBe('administrador');
  });
});
