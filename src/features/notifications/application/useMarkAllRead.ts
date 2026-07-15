import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApiAdapter } from '../infrastructure/notifications-api.adapter';

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApiAdapter.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
