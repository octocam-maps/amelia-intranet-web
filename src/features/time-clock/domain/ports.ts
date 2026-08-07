import type {
  AddTimeClockEntryNoteInput,
  CompensationBalance,
  CreateTimeClockEntriesBatchInput,
  CreateTimeClockEntryInput,
  ListTimeClockEntriesParams,
  TechnicianDailyLog,
  TechnicianDailyLogInput,
  TechnicianMonthPage,
  TechnicianMonthParams,
  Project,
  TimeClockCurrentStatus,
  TimeClockEntriesBatchResult,
  TimeClockEntry,
  TimeClockEntryNote,
  TimeClockEntryPage,
  UpdateTimeClockEntryInput,
} from './models';

export interface TimeClockRepository {
  create(input: CreateTimeClockEntryInput): Promise<TimeClockEntry>;
  /** Alta en lote sobre un rango de hasta 7 días (RF-A3) — siempre para el
   * propio usuario autenticado, igual que `create`. */
  createBatch(input: CreateTimeClockEntriesBatchInput): Promise<TimeClockEntriesBatchResult>;
  list(params: ListTimeClockEntriesParams): Promise<TimeClockEntryPage>;
  update(entryId: string, input: UpdateTimeClockEntryInput): Promise<TimeClockEntry>;
  remove(entryId: string): Promise<void>;
  /** Incidencias/comentarios sobre un tramo (B-2b) — el dueño del tramo o
   * el admin pueden leerlas; solo el admin puede publicarlas. */
  listNotes(entryId: string): Promise<TimeClockEntryNote[]>;
  addNote(entryId: string, input: AddTimeClockEntryNoteInput): Promise<TimeClockEntryNote>;
  /** Descarga el CSV como blob — no es una URL directa porque necesita el
   * header `Authorization` (no hay sesión por cookie fuera de `/auth`).
   * Exporta TODO el rango (sin `limit`/`offset`), no solo la página en
   * pantalla — el backend lo resuelve con `limit=None`. */
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

  // Parte diario del técnico (requerimiento v1.2 §M1). Endpoints separados de
  // los de `/entries` a propósito: el técnico no ficha por tramos y el
  // empleado no cumplimenta partes.
  listTechnicianLogs(params: TechnicianMonthParams): Promise<TechnicianMonthPage>;
  createTechnicianLog(input: TechnicianDailyLogInput): Promise<TechnicianDailyLog>;
  updateTechnicianLog(
    entryId: string,
    input: TechnicianDailyLogInput,
  ): Promise<TechnicianDailyLog>;
  removeTechnicianLog(entryId: string): Promise<void>;
  getCompensationBalance(year: number, userId?: string): Promise<CompensationBalance>;
  /** Excel del mes (hoja Detalle + hoja Resumen). Blob y no URL directa: el
   * endpoint necesita el header `Authorization`. */
  exportTechnicianMonthXlsx(params: TechnicianMonthParams): Promise<Blob>;
  listProjects(): Promise<Project[]>;
}
