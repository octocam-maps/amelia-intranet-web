/**
 * RF-A5.7 (WCAG 1.4.1 / 1.4.3) — hallazgo A11Y-2: la abreviatura de 2
 * letras del tipo de ausencia (segundo canal además del color, ver
 * `absenceTypeAbbreviation.ts`) se pintaba con `color: #fff` fijo sobre el
 * color del propio tipo. Con el catálogo de 10 colores (migración 032),
 * blanco fijo falla el mínimo AA de 4.5:1 en 5 de los 10 (rosas, ámbar,
 * gris azulado, rojo y violeta) — el texto que EXISTE para no depender
 * solo del color queda ilegible, incumpliendo su propia razón de ser.
 *
 * Se elige el color de texto (blanco o negro) según cuál da mayor
 * contraste sobre el fondo recibido, calculando la luminancia relativa con
 * la fórmula WCAG 2.1 (linealización sRGB con umbral 0.04045 y exponente
 * 2.4, pesos 0.2126/0.7152/0.0722). Con esa elección, ninguno de los 10
 * colores del catálogo baja de 4.5:1 (ver
 * `contrastingTextColor.test.ts`).
 */

const WHITE = '#ffffff';
const BLACK = '#000000';

function relativeLuminance(hex: string): number {
  const channel = (value: number) => {
    const srgb = value / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Devuelve `#ffffff` o `#000000`, el que dé mayor contraste WCAG sobre el
 * color de fondo recibido. Si el hex no es válido (p. ej. el tipo llega
 * sin `color` desde el backend), cae a blanco — mismo comportamiento que
 * había antes de este fix, sin romper el resto del render.
 */
export function contrastingTextColor(backgroundHex: string | null | undefined): string {
  if (!backgroundHex || !/^#[0-9a-fA-F]{6}$/.test(backgroundHex)) return WHITE;

  const backgroundLuminance = relativeLuminance(backgroundHex);
  const contrastWithWhite = (1 + 0.05) / (backgroundLuminance + 0.05);
  const contrastWithBlack = (backgroundLuminance + 0.05) / (0 + 0.05);

  return contrastWithBlack > contrastWithWhite ? BLACK : WHITE;
}
