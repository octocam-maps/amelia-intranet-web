import { useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApiAdapter } from '../infrastructure/announcements-api.adapter';
import type { AnnouncementInput } from '../domain/models';

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AnnouncementInput) => announcementsApiAdapter.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'list'] });
    },
  });
}
