import { describe, expect, it } from 'vitest';
import { toDateOnly } from './dateOnly';

describe('toDateOnly', () => {
  it('convierte una fecha ISO (YYYY-MM-DD) a un Date en hora local a medianoche', () => {
    const date = toDateOnly('2026-07-28');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6); // julio = índice 6
    expect(date.getDate()).toBe(28);
    expect(date.getHours()).toBe(0);
  });

  it('no se ve afectada por el desfase de zona horaria de `new Date(iso)` sin hora', () => {
    // `new Date('2026-07-28')` se interpreta en UTC y puede caer en el 27
    // en zonas con offset negativo — toDateOnly evita ese bug construyendo
    // el Date con año/mes/día en hora LOCAL.
    const date = toDateOnly('2026-01-01');

    expect(date.getDate()).toBe(1);
    expect(date.getMonth()).toBe(0);
  });
});
