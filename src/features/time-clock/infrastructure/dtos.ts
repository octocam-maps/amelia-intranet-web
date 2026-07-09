/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface TimeClockEntryDTO {
  id: string;
  user_id: string;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  source: string;
  worked_minutes: number | null;
}

export interface TimeClockEntryListDTO {
  entries: TimeClockEntryDTO[];
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
