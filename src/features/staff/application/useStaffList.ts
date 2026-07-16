import { useQuery } from '@tanstack/react-query';
import { staffApiAdapter } from '../infrastructure/staff-api.adapter';
import type { StaffListParams } from '../domain/models';

interface UseStaffListOptions {
  /** `GET /staff` es exclusivo del admin (backend `require_role`) — otros
   * features que reutilizan este hook (p.ej. el selector de persona de
   * Control horario) deben pasar `enabled: isAdmin` para no disparar la
   * request y su 403 cuando quien mira la pantalla no es admin. */
  enabled?: boolean;
}

export function useStaffList(params: StaffListParams = {}, options: UseStaffListOptions = {}) {
  return useQuery({
    queryKey: ['staff', 'list', params],
    queryFn: () => staffApiAdapter.list(params),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}
