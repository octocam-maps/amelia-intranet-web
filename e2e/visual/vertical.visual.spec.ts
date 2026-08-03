import { expect, test } from '../fixtures';
import { freezeTime, settleForScreenshot } from '../support/determinism';

/**
 * Regresión visual del vertical: login, dashboard y onboarding, en los tres
 * puntos de ruptura.
 *
 * ## Qué protege y qué NO
 *
 * Un baseline dice "esto es lo que acordamos que se ve". Detecta que un cambio
 * en un componente compartido descolocó una pantalla que nadie iba a mirar en
 * el PR. NO dice que el baseline esté bien diseñado: eso lo aporta la
 * auditoría del agente (`AUDIT-PROTOCOL.md`).
 *
 * ## Aceptar un baseline es una decisión, no un trámite
 *
 * `pnpm e2e:update` sobrescribe las referencias. Antes de aceptarlas hay que
 * MIRAR las imágenes: aceptar sin mirar convierte el bug de hoy en la
 * referencia oficial de mañana, y a partir de ahí la suite defiende el bug.
 */

test.describe('Login', () => {
  test('coincide con su referencia visual', async ({ page }) => {
    await freezeTime(page);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Hola de nuevo' })).toBeVisible();
    await settleForScreenshot(page);

    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });
});

test.describe('Dashboard del empleado', () => {
  test.use({ role: 'empleado' });

  test('coincide con su referencia visual', async ({ authedPage }) => {
    await expect(authedPage.getByRole('heading', { level: 1 })).toBeVisible();
    /* Sin este cierre, el hero se captura a veces con "Cargando…" y a veces
       con los datos ya resueltos: dos baselines válidos para el mismo test es
       la receta de un test intermitente. */
    await expect(authedPage.getByText('Cargando…')).toHaveCount(0);
    await settleForScreenshot(authedPage);

    await expect(authedPage).toHaveScreenshot('dashboard-empleado.png', { fullPage: true });
  });
});

test.describe('Dashboard del administrador', () => {
  test.use({ role: 'administrador' });

  test('coincide con su referencia visual', async ({ authedPage }) => {
    await expect(authedPage.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(authedPage.getByText('Cargando…')).toHaveCount(0);
    await settleForScreenshot(authedPage);

    await expect(authedPage).toHaveScreenshot('dashboard-administrador.png', {
      fullPage: true,
    });
  });
});

test.describe('Onboarding', () => {
  test.use({ role: 'empleado' });

  test('coincide con su referencia visual', async ({ authedPage }) => {
    await authedPage.goto('/onboarding');
    const enCurso = authedPage.getByRole('heading', { name: /Te damos la bienvenida/i });
    const completado = authedPage.getByRole('heading', { name: /Onboarding completado/i });
    await expect(enCurso.or(completado)).toBeVisible();
    await settleForScreenshot(authedPage);

    await expect(authedPage).toHaveScreenshot('onboarding.png', {
      fullPage: true,
      /* El reproductor de vídeo del paso 1 pinta un póster que puede tardar y
         no aporta nada al layout que se quiere proteger. */
      mask: [authedPage.locator('video, iframe')],
    });
  });
});
