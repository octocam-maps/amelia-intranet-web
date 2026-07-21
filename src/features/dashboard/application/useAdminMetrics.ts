import { useQuery } from '@tanstack/react-query';
import { dashboardApiAdapter } from '../infrastructure/dashboard-api.adapter';
import type { AdminMetricsFilters } from '../domain/models';

/** KPIs + sparklines + radar de asistencia del Home admin
 * (`GET /dashboard/admin/metrics`, `require_role("administrador")`). Se
 * refetchea al cambiar Sede/Departamento (`queryKey` incluye los filtros);
 * `staleTime` corto porque el KPI "Fichados ahora" es en vivo. `enabled`
 * permite que `DashboardPage` desactive la petición para roles que no son
 * admin (evita un 403 innecesario) sin romper las reglas de hooks. */
export function useAdminMetrics(
  filters: AdminMetricsFilters = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'metrics', filters],
    queryFn: () => dashboardApiAdapter.getAdminMetrics(filters),
    staleTime: 15_000,
    enabled: options.enabled ?? true,
  });
}
