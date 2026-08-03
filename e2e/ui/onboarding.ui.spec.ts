import { expect, test } from '../fixtures';
import { SCREENS } from '../screens';
import { gotoScreen } from '../support/navigate';

const ONBOARDING = SCREENS.find((screen) => screen.id === 'onboarding')!;

/**
 * El onboarding es la pantalla con MENOS referencias visuales del proyecto
 * (`brief-diseno.md §8`: "la Fase 2 va a ciegas") y a la vez la que más
 * importa que esté impecable: es el primer contacto de alguien que acaba de
 * entrar en la empresa y no tiene con qué comparar.
 *
 * El estado del acordeón depende del progreso del usuario, así que el test
 * acepta las dos caras posibles (en curso o completado) en vez de asumir una.
 */

test.describe('Onboarding del empleado', () => {
  test.use({ role: 'empleado' });

  /* El barrido de `screens.ui.spec.ts` ya audita esta pantalla. Aquí quedan
     solo las comprobaciones específicas del onboarding, que es la pantalla con
     menos referencias visuales del proyecto (`brief-diseno.md §8`: "la Fase 2 va
     a ciegas") y la primera que ve alguien que acaba de entrar en la empresa. */

  test('el encabezado de la pantalla no compite con el del Topbar', async ({ authedPage }) => {
    /* Se navega con `gotoScreen` y no con un `goto` suelto a propósito: espera
       el <h1> del Topbar, que depende del rol y por tanto de que `/auth/me`
       haya respondido. Sin esa espera, la auditoría puede capturar el instante
       en que la vista existe pero el título aún no, y reportar "la pantalla no
       tiene ningún h1" — un hallazgo que es de la sonda, no de la app. */
    await gotoScreen(authedPage, ONBOARDING);

    await expect(authedPage.locator('h1')).toHaveCount(1);
    const enCurso = authedPage.getByRole('heading', { name: /Te damos la bienvenida/i });
    const completado = authedPage.getByRole('heading', { name: /Onboarding completado/i });
    await expect(enCurso.or(completado)).toBeVisible();
  });

  test('no usa recuadros de aviso con borde y fondo teñido', async ({ authedPage }) => {
    /* Criterio establecido del proyecto: los avisos van como una línea de
       texto en el encabezado, no como una tarjeta con borde de color y fondo
       teñido — ese patrón no lo usa ninguna otra pantalla de la intranet y
       gasta media pantalla para decir una frase.
       Se comprueba sobre el DOM real: un bloque de aviso se delata por tener
       fondo teñido Y borde del mismo tono de color de estado. */
    await gotoScreen(authedPage, ONBOARDING);

    const calloutsSospechosos = await authedPage.evaluate(() => {
      const isTinted = (color: string): boolean => {
        const match = color.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/i);
        if (!match) return false;
        const alpha = match[4] === undefined ? 1 : Number(match[4]);
        /* Un tinte de color de estado: translúcido pero visible. Los fondos
           sólidos de tarjeta (blanco, gris) quedan fuera. */
        return alpha > 0.03 && alpha < 0.4;
      };

      return Array.from(document.querySelectorAll('div, section, aside'))
        .filter((el) => {
          const style = getComputedStyle(el);
          const hasBorder =
            parseFloat(style.borderLeftWidth) > 0 || parseFloat(style.borderWidth) > 0;
          return hasBorder && isTinted(style.backgroundColor);
        })
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
    });

    expect(
      calloutsSospechosos,
      'Aparece un recuadro de aviso con borde y fondo teñido, patrón retirado ' +
        'del proyecto. El aviso va como línea de texto en el encabezado.',
    ).toEqual([]);
  });
});
