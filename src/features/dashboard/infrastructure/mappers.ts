import type { DashboardSummary } from '../domain/models';
import type { DashboardSummaryDTO } from './dtos';

export function summaryFromDTO(dto: DashboardSummaryDTO): DashboardSummary {
  return {
    vacationBalance: dto.vacation_balance
      ? {
          entitledDays: dto.vacation_balance.entitled_days,
          usedDays: dto.vacation_balance.used_days,
          pendingDays: dto.vacation_balance.pending_days,
          availableDays: dto.vacation_balance.available_days,
        }
      : null,
    todayClockStatus: {
      hasOpenEntry: dto.today_clock_status.has_open_entry,
      workedMinutesToday: dto.today_clock_status.worked_minutes_today,
    },
    upcomingHolidays: dto.upcoming_holidays.map((h) => ({ day: h.day, name: h.name })),
    pendingAbsenceRequests: dto.pending_absence_requests
      ? dto.pending_absence_requests.map((r) => ({
          id: r.id,
          userId: r.user_id,
          userFullName: r.user_full_name,
          absenceTypeName: r.absence_type_name,
          startDate: r.start_date,
          endDate: r.end_date,
          daysCount: r.days_count,
        }))
      : null,
    employeesClockedInNow: dto.employees_clocked_in_now,
  };
}
