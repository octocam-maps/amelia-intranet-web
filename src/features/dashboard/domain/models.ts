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
