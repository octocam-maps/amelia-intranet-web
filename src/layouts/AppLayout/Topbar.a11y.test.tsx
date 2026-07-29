import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guarda a nivel de CSS, no de render: jsdom no evalúa `@media`, así que un
 * test de renderizado a 375 px no puede detectar esto — el `<h1>` está en el
 * DOM en ambos anchos y solo el `display: none` del media query lo saca del
 * árbol de accesibilidad. Un test de render pasaría en vacío.
 *
 * Qué protege: el `<h1>` del Topbar es el ÚNICO de toda la aplicación desde que
 * se retiraron los nueve encabezados duplicados de las páginas. Si además se
 * oculta con `display: none` por debajo de 768 px —el ancho de prueba del
 * proyecto son 375 px—, el resultado es que NINGUNA vista tiene encabezado de
 * nivel 1 en móvil. Los dos cambios eran correctos por separado; la combinación
 * no.
 *
 * `sr-only` mantiene el título en el árbol de accesibilidad sin ocupar ancho,
 * que es lo que se quería: liberar espacio para el botón de menú, no borrar el
 * encabezado.
 */
describe('Topbar — el único <h1> de la app sobrevive en móvil', () => {
  const css = readFileSync('src/layouts/AppLayout/Topbar.module.css', 'utf8');

  it('el encabezado de página no se oculta con display:none en el media query', () => {
    // Se aísla el bloque del media query para no cruzarse con el resto del
    // fichero, donde `display: none` es legítimo en otros selectores.
    const bloqueMovil = css.slice(css.indexOf('@media (max-width: 768px)'));
    const reglaHeading = bloqueMovil.slice(
      bloqueMovil.indexOf('.pageHeading'),
      bloqueMovil.indexOf('}', bloqueMovil.indexOf('.pageHeading'))
    );

    expect(reglaHeading).not.toMatch(/display:\s*none/);
  });

  it('se oculta visualmente conservando el texto para lectores de pantalla', () => {
    const bloqueMovil = css.slice(css.indexOf('@media (max-width: 768px)'));
    const reglaHeading = bloqueMovil.slice(
      bloqueMovil.indexOf('.pageHeading'),
      bloqueMovil.indexOf('}', bloqueMovil.indexOf('.pageHeading'))
    );

    // El patrón de recorte a 1px: sigue siendo accesible, no ocupa ancho.
    expect(reglaHeading).toMatch(/clip-path|clip:/);
    expect(reglaHeading).toMatch(/width:\s*1px/);
  });
});

/**
 * U12 — el atajo de fichaje del Topbar y el botón de `LiveClockCard` son la
 * MISMA acción (mismo hook, `useClockIn`), y en Inicio y en Control horario se
 * ven a la vez. Con los dos en `dark` competían por ser la acción primaria. La
 * primaria es la de la página; el Topbar es el atajo persistente.
 *
 * Guarda a nivel de fuente porque montar el Topbar requiere el árbol completo
 * de proveedores (router + QueryClient + sesión) para llegar a un botón de una
 * línea: el coste no compensa frente a comprobar la variante declarada.
 */
describe('Topbar — el atajo de fichaje no compite con la acción de la página', () => {
  it('el botón "Fichar entrada" del Topbar no es una acción primaria', () => {
    const fuente = readFileSync('src/layouts/AppLayout/Topbar.tsx', 'utf8');
    const bloque = fuente.slice(
      fuente.indexOf('if (!openEntry)'),
      fuente.indexOf('Fichar entrada')
    );

    expect(bloque).toMatch(/variant="outline"/);
    expect(bloque).not.toMatch(/variant="dark"/);
  });
});
