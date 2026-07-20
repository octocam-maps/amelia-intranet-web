import { apiClient } from '@/lib/http/api-client';
import type { AdminDashboardMetrics, AdminMetricsFilters, DashboardSummary, OrgFilterOptions } from '../domain/models';
import type { AdminMetricsDTO, DashboardSummaryDTO, StaffLookupListDTO } from './dtos';
import { metricsFromDTO, orgFilterOptionsFromStaffLookup, summaryFromDTO } from './mappers';

// Página más grande que soporta `GET /staff` (`page_size <= 100`) — ver la
// nota de `orgFilterOptionsFromStaffLookup` sobre el límite que esto impone.
const ORG_LOOKUP_PAGE_SIZE = 100;

export const dashboardApiAdapter = {
  async getSummary(): Promise<DashboardSummary> {
    const dto = await apiClient<DashboardSummaryDTO>('/dashboard/summary');
    return summaryFromDTO(dto);
  },

  async getAdminMetrics(filters: AdminMetricsFilters = {}): Promise<AdminDashboardMetrics> {
    const search = new URLSearchParams();
    if (filters.entityId) search.set('entity_id', filters.entityId);
    // Repetible: el backend acepta `department_id` varias veces
    // (`Query(None)` con `list[str]`) — un valor por cada id que comparte
    // nombre de departamento (ver `AdminMetricsFilters`).
    for (const departmentId of filters.departmentIds ?? []) {
      search.append('department_id', departmentId);
    }
    if (filters.periodDays) search.set('period_days', String(filters.periodDays));
    const query = search.toString();
    const dto = await apiClient<AdminMetricsDTO>(`/dashboard/admin/metrics${query ? `?${query}` : ''}`);
    return metricsFromDTO(dto);
  },

  /** No existe `GET /entities` ni `GET /departments` todavía (ver
   * `dtos.ts`/`mappers.ts`) — se resuelven las opciones de los filtros de
   * Sede/Departamento a partir de la plantilla real. */
  async getOrgFilterOptions(): Promise<OrgFilterOptions> {
    const dto = await apiClient<StaffLookupListDTO>(`/staff?page_size=${ORG_LOOKUP_PAGE_SIZE}`);
    return orgFilterOptionsFromStaffLookup(dto.members);
  },
};
