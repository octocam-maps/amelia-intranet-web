import { useQuery } from '@tanstack/react-query';
import { dashboardApiAdapter } from '../infrastructure/dashboard-api.adapter';

/** Opciones de los selectores de Sede/Departamento del Home admin — derivadas
 * de la plantilla real (`GET /staff`, ver adapter). La estructura de la
 * organización cambia poco: `staleTime` largo para no repetir la consulta en
 * cada cambio de filtro (solo cambia `useAdminMetrics`). */
export function useOrgFilterOptions() {
  return useQuery({
    queryKey: ['dashboard', 'admin', 'org-filter-options'],
    queryFn: () => dashboardApiAdapter.getOrgFilterOptions(),
    staleTime: 5 * 60_000,
  });
}
