import { parseEnum } from '@/lib/parseEnum';
import type {
  AdminDashboardMetrics,
  AttendanceRadarKind,
  DashboardSummary,
  OrgDepartmentOption,
  OrgEntityCode,
  OrgEntityOption,
  OrgFilterOptions,
} from '../domain/models';
import type { AdminMetricsDTO, DashboardSummaryDTO, StaffLookupMemberDTO } from './dtos';

const RADAR_KINDS: AttendanceRadarKind[] = ['late_in', 'overtime_out', 'on_time', 'negative_balance'];
const ENTITY_CODES: OrgEntityCode[] = ['hub', 'lab', 'ops'];

// Nombre para mostrar por código de entidad — el backend solo manda el
// código corto en `/staff` (`entity_code`), no un nombre; mismo criterio que
// `ENTITY_LABEL` en `announcements`/`team`.
const ENTITY_NAME: Record<OrgEntityCode, string> = {
  hub: 'Amelia Hub',
  lab: 'Amelia Lab',
  ops: 'Amelia Ops',
};

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

export function metricsFromDTO(dto: AdminMetricsDTO): AdminDashboardMetrics {
  return {
    kpis: {
      absentToday: dto.kpis.absent_today,
      pendingApprovals: dto.kpis.pending_approvals,
      clockedInNow: dto.kpis.clocked_in_now,
      punctualityPct: dto.kpis.punctuality_pct,
    },
    trends: {
      absences: dto.trends.absences,
      clockedIn: dto.trends.clocked_in,
      punctuality: dto.trends.punctuality,
    },
    attendanceRadar: dto.attendance_radar.map((item) => ({
      userId: item.user_id,
      fullName: item.full_name,
      avatarUrl: item.avatar_url,
      kind: parseEnum(item.kind, RADAR_KINDS, 'on_time'),
      valueMinutes: item.value_minutes,
      detail: item.detail,
    })),
  };
}

/** Deriva las opciones de Sede/Departamento a partir de la plantilla real
 * (`GET /staff`) — no hay endpoint de catálogo (ver nota en `dtos.ts`). Solo
 * cubre los primeros `page_size` empleados que devuelva esa llamada: si la
 * plantilla supera ese límite, alguna combinación entidad/departamento poco
 * frecuente podría no aparecer en el selector. Documentado como limitación
 * conocida, no como dato inventado. */
export function orgFilterOptionsFromStaffLookup(members: StaffLookupMemberDTO[]): OrgFilterOptions {
  const entitiesById = new Map<string, OrgEntityOption>();
  const departmentsById = new Map<string, OrgDepartmentOption>();

  for (const member of members) {
    if (member.entity_id && member.entity_code && !entitiesById.has(member.entity_id)) {
      const code = parseEnum(member.entity_code, ENTITY_CODES, 'hub');
      entitiesById.set(member.entity_id, {
        id: member.entity_id,
        code,
        name: ENTITY_NAME[code],
      });
    }
    if (member.department_id && member.department_name && member.entity_id && !departmentsById.has(member.department_id)) {
      departmentsById.set(member.department_id, {
        id: member.department_id,
        name: member.department_name,
        entityId: member.entity_id,
      });
    }
  }

  return {
    entities: [...entitiesById.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    departments: [...departmentsById.values()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
  };
}
