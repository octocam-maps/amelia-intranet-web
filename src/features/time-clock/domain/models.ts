export type TimeClockSource = 'web' | 'mobile';

/** Un tramo de fichaje (entrada/salida elegidas manualmente) — decisión de
 * la demo: control horario por SELECCIÓN MANUAL DE TRAMOS, no en tiempo real. */
export interface TimeClockEntry {
  id: string;
  userId: string;
  workDate: string; // 'YYYY-MM-DD'
  clockIn: string; // ISO datetime
  clockOut: string | null;
  source: TimeClockSource;
  workedMinutes: number | null;
}

export interface CreateTimeClockEntryInput {
  workDate: string;
  clockIn: string;
  clockOut?: string | null;
}

export interface UpdateTimeClockEntryInput {
  clockIn: string;
  clockOut?: string | null;
}

export interface ListTimeClockEntriesParams {
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** Tramo abierto ahora mismo (fichaje en vivo) — `onBreak` distingue
 * "en jornada" de "en pausa" para la pill del topbar y la tarjeta de Inicio. */
export interface OpenTimeClockEntry {
  id: string;
  clockIn: string; // ISO datetime
  onBreak: boolean;
}

/** Estado en vivo (`GET /time-clock/current`) — contrato acordado con el
 * backend (mismo shape para las 4 acciones de `/time-clock/{clock-in,
 * clock-out,breaks/start,breaks/end}`, todas devuelven el estado
 * recalculado tras el cambio). Respalda el pill del topbar y la tarjeta
 * grande de Inicio. */
export interface TimeClockCurrentStatus {
  openEntry: OpenTimeClockEntry | null;
  weekWorkedMinutes: number;
  expectedWeeklyMinutes: number;
}
