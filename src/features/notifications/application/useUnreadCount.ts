import { useQuery } from '@tanstack/react-query';
import { notificationsApiAdapter } from '../infrastructure/notifications-api.adapter';

/** Polling ligero: la campana no necesita tiempo real, con ~45s el contador
 * se mantiene razonablemente al día sin abrir un websocket para esto. */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApiAdapter.unreadCount(),
    staleTime: 30_000,
    refetchInterval: 45_000,
  });
}
