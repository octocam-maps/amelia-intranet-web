import type {
  CreateTimeClockEntryInput,
  ListTimeClockEntriesParams,
  TimeClockCurrentStatus,
  TimeClockEntry,
  UpdateTimeClockEntryInput,
} from './models';

export interface TimeClockRepository {
  create(input: CreateTimeClockEntryInput): Promise<TimeClockEntry>;
  list(params: ListTimeClockEntriesParams): Promise<TimeClockEntry[]>;
  update(entryId: string, input: UpdateTimeClockEntryInput): Promise<TimeClockEntry>;
  remove(entryId: string): Promise<void>;
  /** Descarga el CSV como blob — no es una URL directa porque necesita el
   * header `Authorization` (no hay sesión por cookie fuera de `/auth`). */
  exportCsv(params: ListTimeClockEntriesParams): Promise<Blob>;
  /** Informe XLSX con logo de marca de TODA la plantilla, últimos 30 días —
   * solo admin (`GET /time-clock/entries/export.xlsx`, backend enforced).
   * Sin parámetros: a diferencia del CSV, es un informe fijo de RRHH, no una
   * exportación del listado filtrado en pantalla. */
  exportXlsx(): Promise<Blob>;

  // Fichaje en vivo (modelo "ambos") — contrato acordado con el backend:
  // `/time-clock/current|clock-in|clock-out|breaks/start|breaks/end`, las 4
  // acciones devuelven el estado recalculado tras el cambio.
  getCurrent(): Promise<TimeClockCurrentStatus>;
  clockIn(): Promise<TimeClockCurrentStatus>;
  clockOut(): Promise<TimeClockCurrentStatus>;
  startBreak(): Promise<TimeClockCurrentStatus>;
  endBreak(): Promise<TimeClockCurrentStatus>;
}
