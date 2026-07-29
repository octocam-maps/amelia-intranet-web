import { describe, expect, it } from 'vitest';
import { daysUntilLabel } from './daysUntilLabel';

const TODAY = new Date(2026, 6, 28); // 28 de julio de 2026 (fecha-only)

describe('daysUntilLabel', () => {
  it('devuelve "Empieza hoy" cuando la fecha de inicio es hoy', () => {
    expect(daysUntilLabel('2026-07-28', TODAY)).toBe('Empieza hoy');
  });

  it('devuelve "Mañana" cuando falta exactamente 1 día', () => {
    expect(daysUntilLabel('2026-07-29', TODAY)).toBe('Mañana');
  });

  it('devuelve "En N días" para el resto de casos', () => {
    expect(daysUntilLabel('2026-08-09', TODAY)).toBe('En 12 días');
  });

  it('no devuelve un valor negativo si por lo que sea la fecha ya pasó (defensivo)', () => {
    expect(daysUntilLabel('2026-07-01', TODAY)).toBe('Empieza hoy');
  });
});
