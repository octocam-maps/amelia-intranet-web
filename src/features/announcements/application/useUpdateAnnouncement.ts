import { useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApiAdapter } from '../infrastructure/announcements-api.adapter';
import type { AnnouncementInput } from '../domain/models';

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AnnouncementInput> }) =>
      announcementsApiAdapter.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements', 'list'] });
    },
  });
}
