import type { Page } from '@playwright/test';

/**
 * Todo lo que hace que dos ejecuciones de la misma pantalla produzcan el
 * mismo píxel.
 *
 * Sin esto, la regresión visual muere en una semana: los baselines empiezan a
 * fallar por motivos que no son bugs (la fecha de hoy cambió, la fuente aún
 * no había cargado) y el equipo aprende a ignorar los fallos. Una suite que
 * se ignora es peor que no tenerla, porque da una falsa sensación de red.
 */

/* Miércoles laborable a media mañana: ni fin de semana (que vacía el
   calendario y el fichaje) ni festivo nacional. Cambiar esta constante
   invalida TODOS los baselines a la vez. */
export const FIXED_NOW = new Date('2026-03-18T09:30:00+01:00');

export async function freezeTime(page: Page): Promise<void> {
  /* `setFixedTime` en vez de `install`: la app no depende de que el reloj
     avance, y un reloj instalado y pausado congelaría también los timers de
     React Query y de las transiciones de Radix, que sí necesitan correr para
     que la UI termine de asentarse. */
  await page.clock.setFixedTime(FIXED_NOW);
}

/**
 * Oculta lo que es legítimamente variable pero no aporta a la auditoría
 * visual. Se aplica como CSS para que Playwright no tenga que enmascarar
 * regiones a mano en cada aserción.
 */
export async function hideVolatileContent(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      /* El caret de los inputs parpadea y aparece o no según el timing. */
      * { caret-color: transparent !important; }
      /* Los avatares de Google son remotos: si tardan, el baseline captura el
         hueco; si cargan, capturan una foto que puede cambiar. */
      img[src*="googleusercontent.com"] { visibility: hidden !important; }
    `,
  });
}

/** Las fuentes web recolocan el texto al cargar: capturar antes produce diffs. */
export async function waitForFonts(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

/**
 * Prepara la página para una captura estable. Llamar justo antes de
 * `toHaveScreenshot`, con la pantalla ya cargada.
 */
export async function settleForScreenshot(page: Page): Promise<void> {
  await waitForFonts(page);
  await hideVolatileContent(page);
  /* React Query resuelve sus queries y React repinta: dos frames de margen
     evitan capturar un esqueleto de carga a medio camino. */
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
