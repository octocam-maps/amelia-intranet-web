import { useQuery } from '@tanstack/react-query';
import { notificationsApiAdapter } from '../infrastructure/notifications-api.adapter';

/** Primera página del listado (panel de la campana) — sin paginación por
 * "before" todavía: el panel no la necesita hasta que exista una vista de
 * historial completo. */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApiAdapter.list(),
    staleTime: 30_000,
  });
}
