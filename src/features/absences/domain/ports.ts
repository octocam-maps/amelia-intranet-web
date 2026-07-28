import type {
  AbsenceBalance,
  AbsenceCalendarEntry,
  AbsenceCalendarRangeParams,
  AbsenceRequest,
  AbsenceType,
  AbsenceTypeInput,
  CreateAbsenceRequestInput,
  ListAbsenceRequestsMode,
  ReviewAbsenceRequestInput,
} from './models';

export interface AbsencesRepository {
  listTypes(): Promise<AbsenceType[]>;
  listAllTypes(): Promise<AbsenceType[]>;
  createType(input: AbsenceTypeInput): Promise<AbsenceType>;
  updateType(id: string, input: Partial<AbsenceTypeInput>): Promise<AbsenceType>;
  getBalance(params?: { userId?: string; year?: number }): Promise<AbsenceBalance[]>;
  createRequest(input: CreateAbsenceRequestInput): Promise<AbsenceRequest>;
  listRequests(params?: {
    mode?: ListAbsenceRequestsMode;
    userId?: string;
  }): Promise<AbsenceRequest[]>;
  reviewRequest(requestId: string, input: ReviewAbsenceRequestInput): Promise<AbsenceRequest>;

  /** "Calendario general de la plantilla" (LOTE 4) — TODOS los empleados,
   * acotado por rango de fechas. Admin/Socio en el backend
   * (`require_role("administrador", "socio")`), no solo un ítem oculto del
   * navbar. NO acepta `userId` — a diferencia de los 2 exports de abajo,
   * `/calendar/all` no cambia de comportamiento con RF-A1. */
  listCalendar(params: AbsenceCalendarRangeParams): Promise<AbsenceCalendarEntry[]>;
  /** Descarga el XLSX (logo de marca, mismo rango que `listCalendar`) como
   * blob. RF-A1: Admin/Socio y Empleado en el backend — `userId` opcional
   * filtra el export a un empleado concreto (Empleado solo puede pedir el
   * suyo, el backend rechaza con 403 cualquier otro). */
  exportCalendarXlsx(params: AbsenceCalendarRangeParams): Promise<Blob>;
  /** Descarga el PDF (logo de marca, mismo rango que `listCalendar`) como
   * blob — mismo alcance de rol y `userId` que `exportCalendarXlsx`. */
  exportCalendarPdf(params: AbsenceCalendarRangeParams): Promise<Blob>;
}
