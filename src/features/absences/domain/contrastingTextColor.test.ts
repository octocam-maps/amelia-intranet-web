import { describe, expect, it } from 'vitest';
import { contrastingTextColor } from './contrastingTextColor';

// WCAG 2.1 — luminancia relativa (linealización sRGB, umbral 0.04045,
// exponente 2.4, pesos 0.2126/0.7152/0.0722) y ratio de contraste
// (L1 + 0.05) / (L2 + 0.05). Mínimo AA para texto pequeño: 4.5:1.
function relativeLuminance(hex: string): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

// Los 10 colores del catálogo de tipos de ausencia (migración 032). Con
// blanco fijo, 5 de 10 fallaban el mínimo WCAG AA de 4.5:1 — ver hallazgo
// A11Y-2 (verificación de contraste en engram
// `sdd/ampliacion-v11-rrhh/verificacion-paleta-accesibilidad`).
const CATALOG_COLORS = [
  '#F9A8D4', // permiso_matrimonio
  '#F59F0A', // vacaciones
  '#94A3B8', // bloqueado
  '#EF4343', // baja_medica
  '#8B5CF6', // remoto
  '#C2410C', // asuntos_propios
  '#0E7490', // enfermedad_familiar
  '#78716C', // descanso_horas_extra
  '#1E3A8A', // paternidad
  '#44403C', // fallecimiento_familiar
];

describe('contrastingTextColor', () => {
  it.each(CATALOG_COLORS)(
    'elige un color de texto con contraste AA (>= 4.5:1) sobre %s',
    (backgroundHex) => {
      const textColor = contrastingTextColor(backgroundHex);
      const ratio = contrastRatio(backgroundHex, textColor);

      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );

  it('elige negro sobre un color de fondo claro', () => {
    expect(contrastingTextColor('#F9A8D4')).toBe('#000000');
  });

  it('elige blanco sobre un color de fondo oscuro', () => {
    expect(contrastingTextColor('#1E3A8A')).toBe('#ffffff');
  });
});
