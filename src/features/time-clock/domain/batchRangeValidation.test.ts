import { describe, expect, it } from 'vitest';
import {
  BATCH_MAX_DAYS,
  validateBatchRange,
  validateWorkDateNotFuture,
} from './batchRangeValidation';

// "Hoy" fijo para todos los tests: viernes 2026-07-17 — mismo caso de uso
// que el backend (fichar la semana en curso un viernes, lunes->domingo).
const TODAY = '2026-07-17';

describe('validateBatchRange', () => {
  it('acepta un rango válido con sábado/domingo futuros (fin de semana, no cuenta como futuro)', () => {
    const result = validateBatchRange('2026-07-13', '2026-07-19', TODAY);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('rechaza cuando la fecha de inicio es posterior a la fecha de fin', () => {
    const result = validateBatchRange('2026-07-19', '2026-07-13', TODAY);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/inicio.*posterior/i);
  });

  it(`rechaza un rango de más de ${BATCH_MAX_DAYS} días`, () => {
    const result = validateBatchRange('2026-07-13', '2026-07-21', TODAY); // 9 días

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(new RegExp(`${BATCH_MAX_DAYS} días`));
  });

  it('acepta un rango de exactamente 7 días (límite inclusivo)', () => {
    const result = validateBatchRange('2026-07-13', '2026-07-19', TODAY); // 7 días

    expect(result.valid).toBe(true);
  });

  it('rechaza un día laborable futuro sin exclusión (mismo espíritu que LOGIC-2 del backend)', () => {
    const result = validateBatchRange('2026-07-16', '2026-07-20', TODAY); // incluye el lunes 20, futuro

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/futuro/i);
  });

  it('requiere ambas fechas', () => {
    const result = validateBatchRange('', '2026-07-19', TODAY);

    expect(result.valid).toBe(false);
  });
});

describe('validateWorkDateNotFuture — alta de UN día (LOGIC-2)', () => {
  it('acepta hoy', () => {
    expect(validateWorkDateNotFuture(TODAY, TODAY).valid).toBe(true);
  });

  it('acepta una fecha pasada', () => {
    expect(validateWorkDateNotFuture('2026-07-10', TODAY).valid).toBe(true);
  });

  it('rechaza mañana', () => {
    const result = validateWorkDateNotFuture('2026-07-18', TODAY);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/fecha futura/i);
  });

  it('rechaza un SÁBADO futuro, al contrario que el lote', () => {
    // Diferencia deliberada con `validateBatchRange`: el lote exime el fin de
    // semana porque lo excluye automáticamente, pero el alta unitaria registra
    // el sábado tal cual se pida — es su razón de ser frente al lote—, así que
    // el backend la rechaza con 422. 2026-07-18 es sábado.
    expect(new Date('2026-07-18T00:00:00').getDay()).toBe(6);
    expect(validateBatchRange('2026-07-18', '2026-07-18', TODAY).valid).toBe(true);
    expect(validateWorkDateNotFuture('2026-07-18', TODAY).valid).toBe(false);
  });

  it('rechaza una fecha vacía', () => {
    const result = validateWorkDateNotFuture('', TODAY);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/selecciona la fecha/i);
  });

  it('compara por cadena ISO, no por Date: fin de año no rompe el orden', () => {
    expect(validateWorkDateNotFuture('2026-12-31', '2027-01-01').valid).toBe(true);
    expect(validateWorkDateNotFuture('2027-01-01', '2026-12-31').valid).toBe(false);
  });
});
