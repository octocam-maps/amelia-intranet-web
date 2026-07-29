/**
 * Contraste WCAG. Existe para poder MEDIR la paleta en un test en vez de
 * confiar en que alguien la midió al elegirla.
 *
 * Motivo por el que se escribió: el catálogo de color del producto nunca se
 * validó como texto. El resultado fue que el botón primario —blanco sobre el
 * verde de marca `#00D170`— daba **2,03:1** cuando AA pide 4,5:1, y las cuatro
 * variantes de `Badge` (texto del color puro sobre un tinte del MISMO color)
 * quedaban entre 1,8:1 y 3,2:1. Ninguna herramienta lo detectaba porque el
 * código era válido: solo se ve midiendo.
 *
 * Fórmula: WCAG 2.1 § luminancia relativa + § ratio de contraste.
 */

/** `#RGB`, `#RRGGBB` o `hsl(H S% L%)` — los dos formatos que usa el proyecto. */
export function parseColor(value: string): [number, number, number] {
  const trimmed = value.trim();

  const hslMatch = trimmed.match(
    /^hsla?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%/i
  );
  if (hslMatch) {
    return hslToRgb(Number(hslMatch[1]), Number(hslMatch[2]) / 100, Number(hslMatch[3]) / 100);
  }

  // Acepta también el cuerpo suelto de un token (`152 100% 41%`), que es como
  // viven en `index.css` para poder componerse con `hsl(var(--x) / 0.12)`.
  const tokenMatch = trimmed.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (tokenMatch) {
    return hslToRgb(Number(tokenMatch[1]), Number(tokenMatch[2]) / 100, Number(tokenMatch[3]) / 100);
  }

  const hex = trimmed.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Color no reconocido: "${value}"`);
  }
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

/** Luminancia relativa (WCAG 2.1). */
export function relativeLuminance(color: string): number {
  const [r, g, b] = parseColor(color).map((channel) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Ratio de contraste entre dos colores OPACOS, de 1:1 a 21:1. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Aplana un color translúcido sobre un fondo opaco.
 *
 * Imprescindible para auditar `Badge`: su fondo es `hsl(var(--x) / 0.12)`, y
 * `contrastRatio` solo sabe de colores opacos. Medir el texto contra el color
 * SIN aplanar da un resultado falso —y optimista.
 */
export function flatten(color: string, background: string, alpha: number): string {
  const fg = parseColor(color);
  const bg = parseColor(background);
  const mixed = fg.map((channel, i) => Math.round(channel * alpha + bg[i]! * (1 - alpha)));
  return `#${mixed.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Umbrales de AA. El texto grande (≥18,66px en negrita o ≥24px) baja a 3:1. */
export const AA_NORMAL_TEXT = 4.5;
export const AA_LARGE_TEXT = 3;
export const AA_NON_TEXT = 3;
