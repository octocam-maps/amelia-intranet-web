/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface VacationBalanceDTO {
  entitled_days: number;
  used_days: number;
  pending_days: number;
  available_days: number;
}

export interface TodayClockStatusDTO {
  has_open_entry: boolean;
  worked_minutes_today: number;
}

export interface UpcomingHolidayDTO {
  day: string;
  name: string;
}

export interface PendingAbsenceRequestDTO {
  id: string;
  user_id: string;
  user_full_name: string;
  absence_type_name: string;
  start_date: string;
  end_date: string;
  days_count: number;
}

export interface DashboardSummaryDTO {
  vacation_balance: VacationBalanceDTO | null;
  today_clock_status: TodayClockStatusDTO;
  upcoming_holidays: UpcomingHolidayDTO[];
  pending_absence_requests: PendingAbsenceRequestDTO[] | null;
  employees_clocked_in_now: number | null;
}
