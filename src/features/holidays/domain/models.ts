export type HolidayScope = 'nacional' | 'autonomico' | 'local' | 'empresa';
export type HolidaySource = 'oficial' | 'manual';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  // `null` cuando el festivo no tiene ámbito asignado (filas antiguas).
  scope: HolidayScope | null;
  // 'oficial' == importado de la API oficial; 'manual' == añadido a mano.
  source: HolidaySource;
}

export interface HolidayInput {
  date: string;
  name: string;
  scope: HolidayScope;
}

export interface HolidayListParams {
  year?: number;
}

export interface HolidayImportResult {
  year: number;
  imported: number;
  updated: number;
  skipped: number;
}
