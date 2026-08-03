import { expect, type Page } from '@playwright/test';
import type { Screen } from '../screens';
import { settleForScreenshot } from './determinism';

/**
 * Abre una pantalla y espera a que esté REALMENTE lista.
 *
 * Esperar solo el `load` del navegador no sirve: React monta, pide datos y
 * repinta. Auditar en ese hueco produce hallazgos falsos (un esqueleto de carga
 * tiene contrastes y tamaños que no son los de la pantalla final) y baselines
 * intermitentes.
 *
 * La espera del `<h1>` con el título exacto hace doble trabajo: confirma que la
 * pantalla cargó y que la ruta resolvió a la vista correcta. Un `goto` que
 * redirige en silencio —a `/login` porque la sesión no prendió, o a `/` por el
 * catch-all del router— se delata aquí en vez de producir una auditoría
 * perfecta de la pantalla equivocada.
 */
export async function gotoScreen(page: Page, screen: Screen): Promise<void> {
  await page.goto(screen.path);

  /* `toBeAttached` y NO `toBeVisible`: por debajo de 768 px el `<h1>` del Topbar
     pasa a `sr-only` a propósito —sigue en el árbol de accesibilidad pero no
     ocupa ancho, para dejar sitio al botón de menú (ver `Topbar.module.css` y
     `Topbar.a11y.test.tsx`, que protege justo eso). Exigir visibilidad hacía
     fallar TODAS las pantallas en móvil por un comportamiento correcto y
     deliberado de la app. */
  await expect(
    page.getByRole('heading', { level: 1, name: screen.title }),
    `Se esperaba el <h1> "${screen.title}" en ${screen.path}. Si no aparece, la ` +
      'ruta redirigió a otra vista (sesión no aplicada, o rol sin acceso).',
  ).toBeAttached();

  /* Los estados de carga de la app son textuales ("Cargando…"). Mientras haya
     uno, la pantalla no ha terminado de resolverse. */
  await expect(page.getByText('Cargando…')).toHaveCount(0);

  await settleForScreenshot(page);
}
