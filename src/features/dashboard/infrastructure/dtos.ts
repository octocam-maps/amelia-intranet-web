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

// --- `GET /dashboard/admin/metrics` -----------------------------------------

export interface AdminMetricsKpisDTO {
  absent_today: number;
  pending_approvals: number;
  clocked_in_now: number;
  punctuality_pct: number;
}

export interface AdminMetricsDTO {
  kpis: AdminMetricsKpisDTO;
}

// --- `GET /staff` — solo los campos usados para resolver los filtros de
// Sede/Departamento (id/entity_id/entity_code/department_id/department_name).
// No hay endpoint de catálogo de entidades/departamentos: se derivan de la
// plantilla real. Nótese que este shape es el de la respuesta REAL del
// backend (`src/features/staff/infrastructure/schemas.py`) — a propósito NO
// se reutiliza `staff/infrastructure/dtos.ts` del propio frontend porque ese
// tipo (`entity_name`, `department` plano, `page`/`page_size`) no coincide
// con lo que el backend manda hoy.
export interface StaffLookupMemberDTO {
  id: string;
  entity_id: string | null;
  entity_code: string | null;
  department_id: string | null;
  department_name: string | null;
}

export interface StaffLookupListDTO {
  members: StaffLookupMemberDTO[];
  total: number;
}
