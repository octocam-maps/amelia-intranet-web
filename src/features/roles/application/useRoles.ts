import { useQuery } from '@tanstack/react-query';
import { rolesApiAdapter } from '../infrastructure/roles-api.adapter';

interface UseRolesOptions {
  /** `GET /roles` es exclusivo del admin (backend `require_role`) — quien
   * llame a este hook fuera de una pantalla admin-only debe pasar
   * `enabled: isAdmin` para no disparar la request y su 403. */
  enabled?: boolean;
}

/** Fuente única de "qué roles existen" para poblar selectores (hoy, solo
 * `StaffForm`) — reemplaza el objeto `ROLE_LABEL`/`ROLES` hardcodeado que
 * había que tocar a mano cada vez que se sumaba un rol nuevo (pasó con
 * `socio`, migración 024). Los roles casi no cambian — `staleTime` largo. */
export function useRoles(options: UseRolesOptions = {}) {
  return useQuery({
    queryKey: ['roles', 'list'],
    queryFn: () => rolesApiAdapter.list(),
    staleTime: 5 * 60_000,
    enabled: options.enabled ?? true,
  });
}
