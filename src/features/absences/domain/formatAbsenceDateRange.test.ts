import { describe, expect, it } from 'vitest';
import { formatAbsenceDateRange } from './formatAbsenceDateRange';

describe('formatAbsenceDateRange', () => {
  it('un único día muestra solo esa fecha', () => {
    expect(formatAbsenceDateRange('2026-08-03', '2026-08-03')).toBe('3 ago');
  });

  it('un rango de varios días muestra inicio → fin', () => {
    expect(formatAbsenceDateRange('2026-08-03', '2026-08-07')).toBe('3 ago → 7 ago');
  });

  it('no deja el punto de la abreviatura del mes (ej. "ago." -> "ago")', () => {
    const formatted = formatAbsenceDateRange('2026-08-03', '2026-08-03');
    expect(formatted).not.toContain('.');
  });
});
