import { describe, expect, it } from 'vitest';
import {
  crossesMidnight,
  endsNextDay,
  effectiveMinutes,
  formatCompensationDays,
  formatMinutes,
  grossMinutes,
  validateTechnicianLog,
} from './technicianLog';
import type { TechnicianLogFormValues } from './technicianLog';

function values(overrides: Partial<TechnicianLogFormValues> = {}): TechnicianLogFormValues {
  return {
    workDate: '2026-08-05',
    startTime: '08:00',
    endTime: '20:30',
    projectId: 'p-1',
    workLocation: 'Guadix, Granada',
    hadBreak: true,
    breakMinutes: 45,
    hadOvernight: true,
    overnightPlace: 'espana',
    productCategory: 'hardware',
    ...overrides,
  };
}

describe('grossMinutes', () => {
  it('calcula una jornada normal', () => {
    expect(grossMinutes('08:00', '20:30')).toBe(750);
  });

  it('resuelve la jornada que cruza la medianoche', () => {
    // LA regla del parte de campo: el técnico vuelve al hotel de madrugada y
    // debe poder registrarlo. 08:00 -> 01:30 son 17h30m, no un error.
    expect(grossMinutes('08:00', '01:30')).toBe(1050);
  });

  it('trata las 24:00 como medianoche del día siguiente', () => {
    // El caso literal del requerimiento: «de 08:00 a 24:00».
    expect(grossMinutes('08:00', '00:00')).toBe(960);
  });

  it('detecta el cruce de día', () => {
    expect(crossesMidnight('08:00', '01:30')).toBe(true);
    expect(crossesMidnight('08:00', '20:30')).toBe(false);
  });
});

describe('effectiveMinutes', () => {
  it('descuenta la pausa del bruto', () => {
    expect(effectiveMinutes({ startTime: '08:00', endTime: '20:30', breakMinutes: 45 })).toBe(705);
  });

  it('descuenta también en jornadas que cruzan la medianoche', () => {
    expect(effectiveMinutes({ startTime: '08:00', endTime: '01:30', breakMinutes: 60 })).toBe(990);
  });
});

describe('validateTechnicianLog', () => {
  it('acepta un parte completo', () => {
    expect(validateTechnicianLog(values())).toBeNull();
  });

  it('rechaza pausa informada habiendo marcado que no hubo', () => {
    expect(validateTechnicianLog(values({ hadBreak: false, breakMinutes: 30 }))).toContain(
      '30 minutos',
    );
  });

  it('rechaza pausa marcada sin minutos', () => {
    expect(validateTechnicianLog(values({ hadBreak: true, breakMinutes: 0 }))).toContain(
      'indica cuántos minutos',
    );
  });

  it('rechaza una pausa mayor que la jornada', () => {
    const result = validateTechnicianLog(
      values({ startTime: '08:00', endTime: '10:00', breakMinutes: 150 }),
    );
    expect(result).toContain('superar la duración');
  });

  it('rechaza el lugar de trabajo vacío', () => {
    expect(validateTechnicianLog(values({ workLocation: '   ' }))).toContain('lugar de trabajo');
  });

  it('rechaza el parte sin proyecto', () => {
    expect(validateTechnicianLog(values({ projectId: '' }))).toContain('proyecto');
  });

  it('rechaza inicio y fin idénticos', () => {
    const result = validateTechnicianLog(
      values({ startTime: '08:00', endTime: '08:00', hadBreak: false, breakMinutes: 0 }),
    );
    expect(result).toContain('distinta');
  });
});

describe('endsNextDay', () => {
  // El backend serializa el instante en UTC. Estos ISO son los que llegan de
  // verdad, no los que se leen en pantalla.
  it('marca la jornada que termina de madrugada aunque el ISO diga el día anterior', () => {
    // 01:30 del 6 de agosto en Madrid (+02:00) = 23:30 del día 5 en UTC.
    // Recortar la cadena diría "mismo día" justo cuando SÍ hay que avisar.
    expect(endsNextDay({ workDate: '2026-08-05', endedAt: '2026-08-05T23:30:00+00:00' })).toBe(
      true,
    );
  });

  it('no marca una jornada que termina el mismo día', () => {
    // 20:30 del 5 de agosto en Madrid = 18:30 UTC del mismo día.
    expect(endsNextDay({ workDate: '2026-08-05', endedAt: '2026-08-05T18:30:00+00:00' })).toBe(
      false,
    );
  });
});

describe('formato', () => {
  it('presenta los minutos como horas y minutos', () => {
    expect(formatMinutes(705)).toBe('11h 45m');
    expect(formatMinutes(1566)).toBe('26h 06m');
  });

  it('convierte el saldo a días con la jornada de referencia de 8 h', () => {
    expect(formatCompensationDays(480)).toBe('1 día');
    expect(formatCompensationDays(960)).toBe('2 días');
    // 26h06m de compensación son 3,3 días — el saldo vive en minutos y los
    // días son solo presentación.
    expect(formatCompensationDays(1566)).toBe('3,3 días');
  });
});
