export type HolidayScope = 'nacional' | 'autonomico' | 'local';

export interface Holiday {
  id: string;
  date: string;
  name: string;
  scope: HolidayScope;
}

export interface HolidayInput {
  date: string;
  name: string;
  scope: HolidayScope;
}

export interface HolidayListParams {
  year?: number;
}
