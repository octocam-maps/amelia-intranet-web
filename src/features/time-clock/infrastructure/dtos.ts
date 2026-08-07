/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface TimeClockEntryDTO {
  id: string;
  user_id: string;
  full_name: string | null;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  source: string;
  worked_minutes: number | null;
}

export interface TimeClockEntryListDTO {
  entries: TimeClockEntryDTO[];
  total: number;
  limit: number;
  offset: number;
}

export interface OmittedBatchDayDTO {
  work_date: string;
  reason: string;
}

export interface TimeClockEntriesBatchDTO {
  created: TimeClockEntryDTO[];
  omitted: OmittedBatchDayDTO[];
}

export interface OpenTimeClockEntryDTO {
  id: string;
  clock_in: string;
  on_break: boolean;
}

export interface TimeClockCurrentStatusDTO {
  open_entry: OpenTimeClockEntryDTO | null;
  week_worked_minutes: number;
  expected_weekly_minutes: number;
}

export interface TimeClockEntryNoteDTO {
  id: string;
  entry_id: string;
  author_id: string | null;
  author_full_name: string | null;
  body: string;
  created_at: string;
}

export interface TimeClockEntryNoteListDTO {
  notes: TimeClockEntryNoteDTO[];
}

// --- Parte diario del técnico (requerimiento v1.2 §M1) ---

export interface TechnicianDailyLogDTO {
  entry_id: string;
  user_id: string;
  full_name: string | null;
  work_date: string;
  started_at: string;
  ended_at: string;
  project_id: string;
  project_name: string | null;
  work_location: string;
  had_break: boolean;
  break_minutes: number;
  overnight_stay: string;
  product_category: string;
  worked_minutes: number;
}

export interface TechnicianMonthSummaryDTO {
  year: number;
  month: number;
  budget_minutes: number;
  worked_minutes: number;
  remaining_minutes: number;
  overtime_minutes: number;
  compensation_minutes: number;
  overnight_stays_spain: number;
  overnight_stays_abroad: number;
  overnight_stays_total: number;
  is_closed: boolean;
}

export interface TechnicianDailyLogListDTO {
  logs: TechnicianDailyLogDTO[];
  summary: TechnicianMonthSummaryDTO;
}

export interface CompensationBalanceDTO {
  year: number;
  accrued_minutes: number;
  consumed_minutes: number;
  available_minutes: number;
  pending_minutes: number;
}
