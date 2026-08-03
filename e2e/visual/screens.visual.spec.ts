import { expect, test } from '../fixtures';
import type { E2ERole } from '../fixtures/users';
import { ROLE_VARIANTS, SCREENS, type Screen } from '../screens';
import { freezeTime, settleForScreenshot } from '../support/determinism';
import { gotoScreen } from '../support/navigate';

/**
 * Regresión visual de todas las pantallas, en los tres anchos.
 *
 * ## Qué protege y qué NO
 *
 * Un baseline dice "esto es lo que acordamos que se ve". Detecta que un cambio
 * en un componente compartido descolocó una pantalla que nadie iba a mirar en
 * el PR — el fallo que ninguna otra capa ve. NO dice que el baseline esté bien
 * diseñado: eso lo aporta la auditoría del agente (`AUDIT-PROTOCOL.md`).
 *
 * ## Aceptar un baseline es una decisión, no un trámite
 *
 * `pnpm e2e:update` sobrescribe las referencias. Antes de aceptarlas hay que
 * MIRAR las imágenes: aceptar sin mirar convierte el bug de hoy en la
 * referencia oficial de mañana, y a partir de ahí la suite defiende el bug.
 */

/** El login es la única pantalla sin sesión. */
test.describe('Login', () => {
  test('coincide con su referencia visual', async ({ page }) => {
    await freezeTime(page);
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Hola de nuevo' })).toBeVisible();
    await settleForScreenshot(page);

    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });
});

/* Una captura por pantalla con su rol representativo. Capturar cada pantalla
   con los cinco roles multiplicaría los baselines sin añadir información: la
   mayoría son idénticas y las que no lo son están en ROLE_VARIANTS. */
const visualCases: Array<{ id: string; role: E2ERole; screen: Screen }> = [
  ...SCREENS.map((screen) => ({
    id: screen.id,
    role: screen.visualRole ?? screen.roles[0]!,
    screen,
  })),
  ...ROLE_VARIANTS,
];

const casesByRole = new Map<E2ERole, typeof visualCases>();
for (const item of visualCases) {
  casesByRole.set(item.role, [...(casesByRole.get(item.role) ?? []), item]);
}

for (const [role, cases] of casesByRole) {
  test.describe(`Pantallas del rol ${role}`, () => {
    test.use({ role });

    for (const { id, screen } of cases) {
      test(`${screen.path} coincide con su referencia visual`, async ({ authedPage }) => {
        await gotoScreen(authedPage, screen);

        await expect(authedPage).toHaveScreenshot(`${id}.png`, {
          fullPage: true,
          /* Vídeos e iframes traen contenido remoto (el vídeo del onboarding, el
             organigrama publicado en Canva) que puede tardar o cambiar sin que
             el layout que se quiere proteger haya cambiado. */
          mask: [authedPage.locator('video, iframe')],
        });
      });
    }
  });
}
