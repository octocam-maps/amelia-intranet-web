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
