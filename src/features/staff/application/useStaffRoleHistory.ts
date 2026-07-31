import { useQuery } from '@tanstack/react-query';
import { staffApiAdapter } from '../infrastructure/staff-api.adapter';

interface UseStaffRoleHistoryOptions {
  /** `GET /staff/{id}/role-history` es ADMIN_ONLY en el backend. Igual que
   * `useStaffList`, quien monte esto desde una pantalla que no sea de
   * administración debe pasar `enabled: false` para no disparar un 403. */
  enabled?: boolean;
}

/**
 * Historial de cambios de rol de una persona (`user_role_history`, migración
 * backend 039), de lo más reciente a lo más antiguo.
 *
 * `staleTime` alto a propósito: es un dato que solo cambia cuando el admin
 * edita el rol de alguien, y en ese caso `useUpdateStaffMember` invalida esta
 * clave. Refetchear cada 30 s como la lista de plantilla sería puro ruido.
 */
export function useStaffRoleHistory(
  userId: string | null,
  options: UseStaffRoleHistoryOptions = {}
) {
  return useQuery({
    queryKey: ['staff', 'role-history', userId],
    queryFn: () => staffApiAdapter.roleHistory(userId as string),
    staleTime: 5 * 60_000,
    enabled: (options.enabled ?? true) && userId != null,
  });
}
