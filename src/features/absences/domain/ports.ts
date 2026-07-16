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
   * acotado por rango de fechas. Admin-only en el backend
   * (`require_role("administrador")`), no solo un ítem oculto del navbar. */
  listCalendar(params: AbsenceCalendarRangeParams): Promise<AbsenceCalendarEntry[]>;
  /** Descarga el XLSX (logo de marca, mismo rango que `listCalendar`) como
   * blob — admin-only en el backend. */
  exportCalendarXlsx(params: AbsenceCalendarRangeParams): Promise<Blob>;
  /** Descarga el PDF (logo de marca, mismo rango que `listCalendar`) como
   * blob — admin-only en el backend. */
  exportCalendarPdf(params: AbsenceCalendarRangeParams): Promise<Blob>;
}
