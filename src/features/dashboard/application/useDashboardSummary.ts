import { useQuery } from '@tanstack/react-query';
import { dashboardApiAdapter } from '../infrastructure/dashboard-api.adapter';

/** `GET /dashboard/summary` — el backend rechaza a `externo_invitado` con
 * 403 (`require_role("administrador", "empleado", "socio")`); `enabled`
 * permite que `DashboardPage` desactive la petición para ese rol sin
 * romper las reglas de hooks (el `useQuery` se sigue llamando siempre, solo
 * no dispara red). */
export function useDashboardSummary(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApiAdapter.getSummary(),
    staleTime: 15_000,
    enabled: options.enabled ?? true,
  });
}
