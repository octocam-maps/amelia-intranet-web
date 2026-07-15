/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface HolidayDTO {
  id: string;
  day: string; // el backend expone `day`, no `date`
  name: string;
  entity_id: string | null;
  entity_code: string | null;
  created_at: string;
  updated_at: string;
  source: string; // 'oficial' | 'manual'
  scope: string | null; // 'nacional' | 'autonomico' | 'local' | 'empresa' | null
}

export interface HolidayListDTO {
  holidays: HolidayDTO[];
}

export interface HolidayInputDTO {
  day: string;
  name: string;
  scope: string;
}

export interface HolidayImportResultDTO {
  year: number;
  imported: number;
  updated: number;
  skipped: number;
}
