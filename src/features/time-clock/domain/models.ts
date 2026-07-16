export type TimeClockSource = 'web' | 'mobile';

/** Un tramo de fichaje (entrada/salida elegidas manualmente) — decisión de
 * la demo: control horario por SELECCIÓN MANUAL DE TRAMOS, no en tiempo real. */
export interface TimeClockEntry {
  id: string;
  userId: string;
  /** Solo lo rellena el listado (`GET /entries`, JOIN a `users` en el
   * backend) — `null` fuera de ahí (no lo necesita el resto del feature). */
  fullName: string | null;
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
  /** Multi-selector de personas (vista admin "toda la plantilla") — si
   * llega junto con `userId`, `userIds` gana. Solo el admin puede pedir más
   * de un id (403 backend en caso contrario). */
  userIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/** Página del historial (`GET /time-clock/entries`) — `total` cuenta TODO
 * el rango sin paginar, para construir el paginador (X1, Lote 1). */
export interface TimeClockEntryPage {
  entries: TimeClockEntry[];
  total: number;
  limit: number;
  offset: number;
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

/** Incidencia/comentario admin sobre un tramo (B-2b) — anotación de RRHH,
 * no una conversación bidireccional: solo el admin puede publicarlas
 * (`POST /entries/{id}/notes`), el dueño del tramo o el admin pueden
 * leerlas. */
export interface TimeClockEntryNote {
  id: string;
  entryId: string;
  /** `null` si el autor fue eliminado (FK `ON DELETE SET NULL`). */
  authorId: string | null;
  authorFullName: string | null;
  body: string;
  createdAt: string; // ISO datetime
}

export interface AddTimeClockEntryNoteInput {
  body: string;
}
