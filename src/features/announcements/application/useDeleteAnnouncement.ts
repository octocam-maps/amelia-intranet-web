import { useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApiAdapter } from '../infrastructure/announcements-api.adapter';

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsApiAdapter.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'list'] });
    },
  });
}
