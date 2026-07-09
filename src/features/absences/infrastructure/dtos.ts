/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface AbsenceTypeDTO {
  id: string;
  code: string;
  name: string;
  is_paid: boolean;
  affects_balance: boolean;
  color: string | null;
}

export interface AbsenceTypeListDTO {
  types: AbsenceTypeDTO[];
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
}

export interface AbsenceRequestListDTO {
  requests: AbsenceRequestDTO[];
}
