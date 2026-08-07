import { describe, expect, it } from 'vitest';
import { toIsoDateTime, toLocalDate, toTimeInput } from './wallClock';

/**
 * Estos tests fijan el contrato que se rompió durante meses en el alta manual:
 * el formulario enviaba `` `${workDate}T${hora}:00Z` ``, pegando una `Z` a una
 * hora local. El listado lo disimulaba leyendo el ISO en crudo, pero el
 * informe XLSX de RRHH convierte a Madrid y mostraba dos horas de más.
 *
 * Se ejecutan con TZ=Europe/Madrid (ver `vite.config.ts` / entorno de CI).
 */

describe('toIsoDateTime', () => {
  it('convierte la hora de pared al instante real, no le pega una Z', () => {
    // 08:00 del 5 de agosto en Madrid (+02:00) son las 06:00 UTC.
    // El bug producía '2026-08-05T08:00:00Z', que son las 10:00 de Madrid.
    expect(toIsoDateTime('2026-08-05', '08:00')).toBe('2026-08-05T06:00:00.000Z');
  });

  it('aplica el offset de invierno cuando toca (+01:00)', () => {
    expect(toIsoDateTime('2026-01-15', '08:00')).toBe('2026-01-15T07:00:00.000Z');
  });

  it('suma un día para la jornada que termina de madrugada', () => {
    // 01:30 del día siguiente = 23:30 UTC del día del parte.
    expect(toIsoDateTime('2026-08-05', '01:30', 1)).toBe('2026-08-05T23:30:00.000Z');
  });
});

describe('ida y vuelta', () => {
  it('lo que el usuario escribe es lo que el usuario vuelve a leer', () => {
    // La propiedad que de verdad importa: sin ella, la hora se desplaza en
    // cada viaje y nadie sabe cuál es la buena.
    for (const time of ['00:30', '08:00', '15:45', '23:00']) {
      expect(toTimeInput(toIsoDateTime('2026-08-05', time))).toBe(time);
    }
  });

  it('también en horario de invierno', () => {
    for (const time of ['00:30', '08:00', '23:00']) {
      expect(toTimeInput(toIsoDateTime('2026-01-15', time))).toBe(time);
    }
  });
});

describe('toLocalDate', () => {
  it('da la fecha en local, no la del ISO en UTC', () => {
    // Las 01:30 de Madrid del día 6 viajan como el día 5 en UTC.
    expect(toLocalDate('2026-08-05T23:30:00+00:00')).toBe('2026-08-06');
  });
});
