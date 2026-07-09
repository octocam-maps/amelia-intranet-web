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
