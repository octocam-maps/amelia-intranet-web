import { expect, test } from '../fixtures';
import { freezeTime, settleForScreenshot } from '../support/determinism';
import { expectNoUiDefects } from '../support/expect-ui';

/**
 * El login es la única pantalla sin sesión, así que usa `page` en vez de
 * `authedPage`. También es la más expuesta: es lo primero que ve una persona
 * nueva el día que entra en la empresa.
 */

test.describe('Login — invariantes de UI', () => {
  test.beforeEach(async ({ page }) => {
    await freezeTime(page);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Hola de nuevo' })).toBeVisible();
    await settleForScreenshot(page);
  });

  test('no tiene defectos de UI bloqueantes', async ({ page }, testInfo) => {
    await expectNoUiDefects(page, testInfo);
  });

  test('el verde de marca es el color de acción, no el azul de las referencias', async ({
    page,
  }) => {
    /* Regla no negociable del proyecto: las capturas de `referencias/` usan
       azul como color de acción y ese azul NO debe arrastrarse. El único azul
       legítimo es `--info` (#1D4FD7) en avisos informativos, nunca en el
       elemento de acción principal. */
    const brandGreen = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),
    );

    expect(brandGreen).toBe('152 100% 41%');
  });
});
