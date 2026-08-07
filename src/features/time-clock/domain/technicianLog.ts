import type { OvernightStay, ProductCategory, TechnicianDailyLog } from './models';
import { minutesOfDay, toLocalDate, toTimeInput } from './wallClock';

// Reexportados: el parte los usa en cada pantalla y venían de aquí antes de
// que el alta manual necesitara los mismos (ver `wallClock.ts`).
export { toIsoDateTime, toTimeInput } from './wallClock';

/**
 * Reglas del parte diario que la UI necesita ANTES de enviar. Son un espejo de
 * las del backend (`create_technician_daily_log.py`), no un sustituto: la
 * fuente de verdad es el servidor y estas solo evitan un viaje para decir algo
 * que ya se sabe.
 */

export const MINUTES_PER_COMPENSATION_DAY = 480; // 8 h = 1 día
export const MONTHLY_BUDGET_MINUTES = 162 * 60;

export const OVERNIGHT_LABEL: Record<OvernightStay, string> = {
  ninguna: 'Sin pernocta',
  espana: 'España',
  extranjero: 'Fuera de España',
};

export const PRODUCT_LABEL: Record<ProductCategory, string> = {
  software: 'Software',
  hardware: 'Hardware',
};

/** `540` → `"9h 00m"`. Se usa en tarjetas, tabla y mensajes de error, así que
 * vive aquí y no repetida en cada componente. */
export function formatMinutes(minutes: number): string {
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  return `${sign}${Math.floor(abs / 60)}h ${String(abs % 60).padStart(2, '0')}m`;
}

/** Los mismos minutos, en días de descanso. Solo presentación: el saldo se
 * guarda y se calcula siempre en minutos. */
export function formatCompensationDays(minutes: number): string {
  const days = minutes / MINUTES_PER_COMPENSATION_DAY;
  const rounded = Math.round(days * 10) / 10;
  return `${rounded.toLocaleString('es-ES')} ${rounded === 1 ? 'día' : 'días'}`;
}

export interface TechnicianLogFormValues {
  workDate: string;
  startTime: string; // 'HH:mm' hora de pared
  endTime: string;
  projectId: string;
  workLocation: string;
  hadBreak: boolean;
  breakMinutes: number;
  hadOvernight: boolean;
  overnightPlace: Exclude<OvernightStay, 'ninguna'>;
  productCategory: ProductCategory;
}

/**
 * Minutos brutos entre dos horas de pared, resolviendo el cruce de medianoche.
 *
 * Si la hora de fin es MENOR O IGUAL que la de inicio se entiende que la
 * jornada terminó al día siguiente. Es la regla que hace que "de 08:00 a
 * 01:30" signifique 17h30m y no un error — y la razón de que el formulario
 * pida horas y no fechas completas: el técnico escribe la hora a la que llegó,
 * no se pelea con un selector de fecha para decir "de madrugada".
 */
export function grossMinutes(startTime: string, endTime: string): number {
  const start = minutesOfDay(startTime);
  const end = minutesOfDay(endTime);
  return end > start ? end - start : end + 24 * 60 - start;
}

export function crossesMidnight(startTime: string, endTime: string): boolean {
  return minutesOfDay(endTime) <= minutesOfDay(startTime);
}

/** Jornada efectiva = bruto − pausa. El backend la recalcula igual e ignora lo
 * que mande el cliente; esto es solo para enseñarla mientras se rellena. */
export function effectiveMinutes(values: {
  startTime: string;
  endTime: string;
  breakMinutes: number;
}): number {
  return grossMinutes(values.startTime, values.endTime) - values.breakMinutes;
}

/** `null` si el parte es válido; si no, el mensaje a mostrar. Un único punto
 * de decisión para que el formulario no reparta las reglas entre cinco
 * `if` sueltos. */
export function validateTechnicianLog(values: TechnicianLogFormValues): string | null {
  if (!values.workDate) return 'Indica la fecha del parte.';
  if (!values.projectId) return 'Selecciona el proyecto.';
  if (values.workLocation.trim().length < 2) return 'Indica el lugar de trabajo.';
  if (!values.startTime || !values.endTime) return 'Indica la hora de inicio y la de fin.';

  // Comparación directa y no `grossMinutes(...) === 0`: con inicio y fin
  // iguales, la regla del cruce de medianoche interpreta la jornada como 24 h
  // completas, no como cero. Es un caso que hay que cortar aquí a mano.
  if (values.startTime === values.endTime) {
    return 'La hora de fin debe ser distinta de la de inicio.';
  }

  const gross = grossMinutes(values.startTime, values.endTime);

  if (!values.hadBreak && values.breakMinutes > 0) {
    return `Has marcado que no hubo pausa pero has informado ${values.breakMinutes} minutos.`;
  }
  if (values.hadBreak && values.breakMinutes <= 0) {
    return 'Has marcado que hubo pausa: indica cuántos minutos.';
  }
  if (values.breakMinutes >= gross) {
    return 'La pausa no puede superar la duración de la jornada.';
  }
  return null;
}

/**
 * `true` si la jornada terminó al día siguiente del que se imputa.
 *
 * Compara la fecha LOCAL del fin, no `endedAt.slice(0, 10)`. El backend
 * serializa el instante en UTC, así que una jornada que acaba a la 01:30 de
 * Madrid viaja como las 23:30 del día ANTERIOR: recortar la cadena decía "el
 * mismo día" justo en el único caso donde hay algo que señalar, y la fila
 * quedaba como "08:00 → 01:30" sin más, que se lee como un error de tecleo en
 * vez de como una jornada de 17 horas.
 */
export function endsNextDay(log: { workDate: string; endedAt: string }): boolean {
  return toLocalDate(log.endedAt) !== log.workDate;
}

export function logToFormValues(log: TechnicianDailyLog): TechnicianLogFormValues {
  return {
    workDate: log.workDate,
    startTime: toTimeInput(log.startedAt),
    endTime: toTimeInput(log.endedAt),
    projectId: log.projectId,
    workLocation: log.workLocation,
    hadBreak: log.hadBreak,
    breakMinutes: log.breakMinutes,
    hadOvernight: log.overnightStay !== 'ninguna',
    overnightPlace: log.overnightStay === 'extranjero' ? 'extranjero' : 'espana',
    productCategory: log.productCategory,
  };
}
