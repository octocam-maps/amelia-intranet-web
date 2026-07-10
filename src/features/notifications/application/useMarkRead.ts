import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApiAdapter } from '../infrastructure/notifications-api.adapter';

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApiAdapter.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
