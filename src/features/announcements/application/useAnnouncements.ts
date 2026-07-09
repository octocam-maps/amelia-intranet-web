import { useQuery } from '@tanstack/react-query';
import { announcementsApiAdapter } from '../infrastructure/announcements-api.adapter';

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements', 'list'],
    queryFn: () => announcementsApiAdapter.list(),
    staleTime: 30_000,
  });
}
