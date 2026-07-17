export interface VacationBalance {
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

export interface TodayClockStatus {
  hasOpenEntry: boolean;
  workedMinutesToday: number;
}

export interface UpcomingHoliday {
  day: string;
  name: string;
}

export interface PendingAbsenceRequestSummary {
  id: string;
  userId: string;
  userFullName: string;
  absenceTypeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
}

/** `pendingAbsenceRequests`/`employeesClockedInNow` solo vienen rellenos
 * (no `null`) cuando el rol es administrador — vista aumentada del admin. */
export interface DashboardSummary {
  vacationBalance: VacationBalance | null;
  todayClockStatus: TodayClockStatus;
  upcomingHolidays: UpcomingHoliday[];
  pendingAbsenceRequests: PendingAbsenceRequestSummary[] | null;
  employeesClockedInNow: number | null;
}

// --- `GET /dashboard/admin/metrics` — Home del administrador ---------------

/** Filtros globales del Home admin. `entityId`/`departmentId` son el UUID
 * real de fila (`entities.id`/`departments.id`), no el código ('hub'…): el
 * backend hace `u.entity_id = $n::uuid`, no admite el código corto. */
export interface AdminMetricsFilters {
  entityId?: string;
  departmentId?: string;
  periodDays?: number;
}

export interface AdminMetricsKpis {
  absentToday: number;
  pendingApprovals: number;
  clockedInNow: number;
  punctualityPct: number;
}

export interface AdminDashboardMetrics {
  kpis: AdminMetricsKpis;
}

// --- Filtros globales (Sede/Departamento) -----------------------------------

/** Entidades legales del grupo — 3 filas fijas (`entities` CHECK constraint),
 * pero el backend de métricas exige su UUID real, así que no basta con
 * hardcodear el código: se resuelven a partir de `GET /staff` (ver
 * `infrastructure/dashboard-api.adapter.ts` para el porqué de no haber un
 * catálogo dedicado todavía). */
export type OrgEntityCode = 'hub' | 'lab' | 'ops';

export interface OrgEntityOption {
  id: string;
  code: OrgEntityCode;
  name: string;
}

export interface OrgDepartmentOption {
  id: string;
  name: string;
  entityId: string;
}

export interface OrgFilterOptions {
  entities: OrgEntityOption[];
  departments: OrgDepartmentOption[];
}
