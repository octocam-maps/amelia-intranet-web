/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface HolidayDTO {
  id: string;
  date: string;
  name: string;
  scope: string;
}

export interface HolidayListDTO {
  holidays: HolidayDTO[];
}

export interface HolidayInputDTO {
  date: string;
  name: string;
  scope: string;
}
