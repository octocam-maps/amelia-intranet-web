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

/** Motivo por el que un día del lote (RF-A3) no generó tramo, sin que eso
 * tumbe el resto del lote — igual que el backend, primer match gana:
 * `fin_de_semana` -> `festivo` -> `ausencia` -> `ya_registrado` ->
 * `fuera_de_ventana`. Un día futuro SIN ninguna de estas exclusiones no
 * tiene motivo de omisión: tumba el lote entero (422), nunca llega aquí. */
export type TimeClockBatchOmissionReason =
  | 'fin_de_semana'
  | 'festivo'
  | 'ausencia'
  | 'ya_registrado'
  | 'fuera_de_ventana';

export interface OmittedTimeClockBatchDay {
  workDate: string; // 'YYYY-MM-DD'
  reason: TimeClockBatchOmissionReason;
}

/** Alta en lote sobre un rango de hasta 7 días — `clockInTime`/`clockOutTime`
 * son hora de PARED 'HH:MM' Europe/Madrid, SIN offset (a diferencia de
 * `CreateTimeClockEntryInput.clockIn`, que sí lo exige): el lote aplica UN
 * MISMO horario a varios días. */
export interface CreateTimeClockEntriesBatchInput {
  dateFrom: string; // 'YYYY-MM-DD'
  dateTo: string; // 'YYYY-MM-DD'
  clockInTime: string; // 'HH:MM'
  clockOutTime?: string | null; // 'HH:MM'
}

/** Respuesta del alta en lote — SIEMPRE 200 en el backend (nunca 201: el
 * lote puede no crear nada, p.ej. una ausencia aprobada que cubre todo el
 * rango, y seguir siendo un resultado válido). */
export interface TimeClockEntriesBatchResult {
  created: TimeClockEntry[];
  omitted: OmittedTimeClockBatchDay[];
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

// --- Parte diario del técnico (requerimiento v1.2 §M1) ---

/** Dónde pernoctó. RRHH lo pregunta en dos pasos (¿hubo? → ¿dónde?) y el
 * formulario lo presenta así, pero el valor que viaja es UNO: con un booleano
 * más un lugar aparte, "no hubo pernocta pero fue en España" sería un estado
 * representable, y acabaría enviándose. */
export type OvernightStay = 'ninguna' | 'espana' | 'extranjero';

/** Línea de producto a la que se imputa la jornada. Eje DISTINTO del
 * departamento, aunque desde el catálogo 2026 existan departamentos con el
 * mismo nombre: alguien de Hardware puede imputar una jornada a Software. */
export type ProductCategory = 'software' | 'hardware';

export interface TechnicianDailyLog {
  entryId: string;
  userId: string;
  fullName: string | null;
  workDate: string; // 'YYYY-MM-DD'
  /** ISO datetime. Puede terminar al día siguiente: la jornada de campo cruza
   * la medianoche y se imputa al día en que EMPIEZA. */
  startedAt: string;
  endedAt: string;
  projectId: string;
  projectName: string | null;
  workLocation: string;
  hadBreak: boolean;
  breakMinutes: number;
  overnightStay: OvernightStay;
  productCategory: ProductCategory;
  /** Lo calcula el backend y NUNCA se envía: es el dato del que cuelga toda
   * la bolsa de 162 h. */
  workedMinutes: number;
}

export interface TechnicianDailyLogInput {
  workDate: string;
  startedAt: string;
  endedAt: string;
  projectId: string;
  workLocation: string;
  hadBreak: boolean;
  breakMinutes: number;
  overnightStay: OvernightStay;
  productCategory: ProductCategory;
}

export interface TechnicianMonthSummary {
  year: number;
  month: number;
  budgetMinutes: number;
  workedMinutes: number;
  remainingMinutes: number;
  overtimeMinutes: number;
  compensationMinutes: number;
  overnightStaysSpain: number;
  overnightStaysAbroad: number;
  overnightStaysTotal: number;
  /** `false` mientras el mes no ha terminado: su excedente todavía puede
   * cambiar, así que no devenga saldo. */
  isClosed: boolean;
}

export interface TechnicianMonthPage {
  logs: TechnicianDailyLog[];
  summary: TechnicianMonthSummary;
}

/** Saldo ANUAL de descanso por horas extra. `pendingMinutes` es lo que
 * devengaría el mes en curso si terminara hoy — llega aparte para poder
 * mostrarlo sin contarlo como disponible. */
export interface CompensationBalance {
  year: number;
  accruedMinutes: number;
  consumedMinutes: number;
  availableMinutes: number;
  pendingMinutes: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
}

export interface TechnicianMonthParams {
  year: number;
  month: number;
  /** Solo el admin puede pedir el de otro técnico. */
  userId?: string;
}
