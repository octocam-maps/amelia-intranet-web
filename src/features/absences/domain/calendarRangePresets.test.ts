import { describe, expect, it } from 'vitest';
import { monthRange, yearRange } from './calendarRangePresets';

describe('monthRange', () => {
  it('cubre 1º a último día del mes visible', () => {
    const range = monthRange(new Date(2026, 6, 15)); // julio 2026 (mes 6 = julio, 0-indexado)

    expect(range).toEqual({ dateFrom: '2026-07-01', dateTo: '2026-07-31' });
  });

  it('resuelve diciembre correctamente sin desbordar a enero del año siguiente', () => {
    const range = monthRange(new Date(2026, 11, 1)); // diciembre 2026

    expect(range).toEqual({ dateFrom: '2026-12-01', dateTo: '2026-12-31' });
  });

  it('resuelve febrero en año bisiesto (2024) con 29 días', () => {
    const range = monthRange(new Date(2024, 1, 10)); // febrero 2024

    expect(range).toEqual({ dateFrom: '2024-02-01', dateTo: '2024-02-29' });
  });

  it('resuelve febrero en año NO bisiesto (2026) con 28 días', () => {
    const range = monthRange(new Date(2026, 1, 10)); // febrero 2026

    expect(range).toEqual({ dateFrom: '2026-02-01', dateTo: '2026-02-28' });
  });
});

describe('yearRange', () => {
  it('cubre 1 de enero a 31 de diciembre del año del cursor', () => {
    const range = yearRange(new Date(2026, 6, 15));

    expect(range).toEqual({ dateFrom: '2026-01-01', dateTo: '2026-12-31' });
  });

  it('funciona igual en un año bisiesto (no cambia el rango, solo el mes interno)', () => {
    const range = yearRange(new Date(2024, 0, 1));

    expect(range).toEqual({ dateFrom: '2024-01-01', dateTo: '2024-12-31' });
  });
});
