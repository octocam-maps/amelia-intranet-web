import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AA_NORMAL_TEXT, contrastRatio, flatten } from './contrast';

/**
 * Mide la paleta REAL de `index.css`, no una copia. Si alguien cambia un token
 * y con ello rompe el contraste, este test lo caza — que es exactamente lo que
 * no existía cuando se eligió el catálogo de color.
 *
 * Historia: el botón primario (blanco sobre el verde de marca `#00D170`) daba
 * **2,03:1**. Las cuatro variantes de `Badge`, que pintan el color puro sobre un
 * tinte del mismo color, quedaban entre 1,8:1 y 3,2:1 — el patrón empeoraba el
 * contraste en vez de ayudarlo. Nadie lo vio porque el código era válido: un
 * defecto de color solo aparece si se mide.
 */

const css = readFileSync('src/index.css', 'utf8');

/** Lee el cuerpo de un token (`--primary: 152 100% 41%` -> `152 100% 41%`). */
function token(name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match) throw new Error(`Token --${name} no encontrado en index.css`);
  return match[1]!.trim();
}

/** Fondos sobre los que puede caer un tinte. El peor caso para texto oscuro es
 *  el más oscuro de los dos, así que se comprueban ambos. */
const SUPERFICIES = [
  ['card', '#FFFFFF'],
  ['background', '#F9FAFB'],
] as const;

describe('Paleta — texto sobre color sólido', () => {
  /**
   * EXCEPCIÓN DE PRODUCTO, decidida por el team-lead el 2026-07-30: el texto
   * sobre el verde de marca vuelve a BLANCO por criterio visual. Se deja
   * MEDIDA aquí en vez de borrar la comprobación — un incumplimiento conocido
   * y con su número a la vista no es lo mismo que un descuido silencioso.
   *
   * Blanco sobre `#00D170` da 2,03:1: no llega ni al 4,5:1 de AA en texto
   * normal ni al 3:1 de texto grande. Navy daba 8,81:1 (AAA) y estuvo vigente
   * entre f6de515 y este cambio.
   *
   * Fijar el ratio esperado mantiene el test útil como canario: si alguien
   * toca el verde de marca, el número se mueve y esto salta.
   */
  it('el texto sobre el verde es blanco por decisión de producto, con AA incumplido a sabiendas', () => {
    expect(token('primary-foreground')).toBe('0 0% 100%');
    const ratio = contrastRatio(token('primary-foreground'), token('primary'));

    expect(ratio).toBeCloseTo(2.03, 2);
    expect(ratio).toBeLessThan(AA_NORMAL_TEXT);
  });

  it('--success arrastra la misma excepción que --primary (es el mismo verde)', () => {
    // Si los dos tokens son el mismo color, su texto debe ser el mismo o
    // aparecerían dos contenedores idénticos con texto de distinto color.
    expect(token('success')).toBe(token('primary'));
    expect(token('success-foreground')).toBe(token('primary-foreground'));
  });

  it('la vía para recuperar AA es la SUPERFICIE, no el color del texto', () => {
    // Documenta las dos salidas medidas, por si se reabre la decisión.
    expect(contrastRatio('#FFFFFF', '#00784F')).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    expect(contrastRatio('#FFFFFF', token('header-bg'))).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('el azul de información pasa AA con texto blanco', () => {
    expect(contrastRatio(token('info-foreground'), token('info'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT
    );
  });
});

describe('Paleta — texto sobre su propio tinte (patrón de Badge)', () => {
  // Alfas copiados de `Badge.module.css`. Si allí cambian, aquí también: el
  // acoplamiento es deliberado, es lo que hace que el test mida lo real.
  const VARIANTES = [
    { nombre: 'success', tinte: 'success', alpha: 0.12, texto: 'success-on-tint' },
    { nombre: 'warning', tinte: 'warning', alpha: 0.14, texto: 'warning-on-tint' },
    { nombre: 'destructive', tinte: 'destructive', alpha: 0.12, texto: 'destructive-on-tint' },
    { nombre: 'info', tinte: 'info', alpha: 0.12, texto: 'info' },
  ] as const;

  for (const { nombre, tinte, alpha, texto } of VARIANTES) {
    for (const [superficie, fondo] of SUPERFICIES) {
      it(`badge ${nombre} sobre ${superficie} pasa AA`, () => {
        const fondoPlano = flatten(token(tinte), fondo, alpha);

        expect(contrastRatio(token(texto), fondoPlano)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      });
    }
  }

  it('el color puro sobre su propio tinte NO llegaba a AA — de ahí los tokens on-tint', () => {
    // Documenta el defecto para que nadie "simplifique" volviendo a usar el
    // color base como texto.
    for (const { tinte, alpha } of VARIANTES.filter((v) => v.nombre !== 'info')) {
      const fondoPlano = flatten(token(tinte), '#FFFFFF', alpha);

      expect(contrastRatio(token(tinte), fondoPlano)).toBeLessThan(AA_NORMAL_TEXT);
    }
  });
});
