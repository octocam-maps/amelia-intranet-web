import { useQuery } from '@tanstack/react-query';
import { dashboardApiAdapter } from '../infrastructure/dashboard-api.adapter';
import type { AdminMetricsFilters } from '../domain/models';

/** KPIs + sparklines + radar de asistencia del Home admin
 * (`GET /dashboard/admin/metrics`). Se refetchea al cambiar Sede/Departamento
 * (`queryKey` incluye los filtros); `staleTime` corto porque el KPI
 * "Fichados ahora" es en vivo. */
export function useAdminMetrics(filters: AdminMetricsFilters = {}) {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'metrics', filters],
    queryFn: () => dashboardApiAdapter.getAdminMetrics(filters),
    staleTime: 15_000,
  });
}
