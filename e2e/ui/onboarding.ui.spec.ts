import { expect, test } from '../fixtures';
import { settleForScreenshot } from '../support/determinism';
import { expectNoUiDefects } from '../support/expect-ui';

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

  test('no tiene defectos de UI bloqueantes', async ({ authedPage }, testInfo) => {
    await authedPage.goto('/onboarding');

    const enCurso = authedPage.getByRole('heading', { name: /Te damos la bienvenida/i });
    const completado = authedPage.getByRole('heading', { name: /Onboarding completado/i });
    await expect(enCurso.or(completado)).toBeVisible();

    await settleForScreenshot(authedPage);
    await expectNoUiDefects(authedPage, testInfo);
  });

  test('no usa recuadros de aviso con borde y fondo teñido', async ({ authedPage }) => {
    /* Criterio establecido del proyecto: los avisos van como una línea de
       texto en el encabezado, no como una tarjeta con borde de color y fondo
       teñido — ese patrón no lo usa ninguna otra pantalla de la intranet y
       gasta media pantalla para decir una frase.
       Se comprueba sobre el DOM real: un bloque de aviso se delata por tener
       fondo teñido Y borde del mismo tono de color de estado. */
    await authedPage.goto('/onboarding');
    await expect(
      authedPage.getByRole('heading', { level: 1 }),
    ).toBeVisible();

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
