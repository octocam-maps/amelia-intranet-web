/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface AbsenceTypeDTO {
  id: string;
  code: string;
  name: string;
  is_paid: boolean;
  affects_balance: boolean;
  color: string | null;
  requires_approval: boolean;
  requires_justification: boolean;
  max_days_per_year: number | null;
  is_active: boolean;
}

export interface AbsenceTypeListDTO {
  types: AbsenceTypeDTO[];
}

export interface AbsenceTypeInputDTO {
  name: string;
  color: string | null;
  affects_balance: boolean;
  requires_approval: boolean;
  requires_justification: boolean;
  max_days_per_year: number | null;
  is_active: boolean;
}

export interface AbsenceBalanceDTO {
  absence_type_id: string;
  year: number;
  entitled_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
}

export interface AbsenceBalanceListDTO {
  balances: AbsenceBalanceDTO[];
}

export interface AbsenceRequestDTO {
  id: string;
  user_id: string;
  absence_type_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: string;
  reviewed_by: string | null;
  review_note: string | null;
  user_full_name: string | null;
}

export interface AbsenceRequestListDTO {
  requests: AbsenceRequestDTO[];
}

export interface AbsenceCalendarEntryDTO {
  request_id: string;
  user_id: string;
  user_full_name: string;
  absence_type_id: string;
  absence_type_name: string;
  absence_type_color: string | null;
  start_date: string;
  end_date: string;
  days_count: number;
  status: string;
}

export interface AbsenceCalendarEntryListDTO {
  entries: AbsenceCalendarEntryDTO[];
}
