import { useQuery } from '@tanstack/react-query';
import { teamApiAdapter } from '../infrastructure/team-api.adapter';

export function useTeamDirectory() {
  return useQuery({
    queryKey: ['team', 'directory'],
    queryFn: () => teamApiAdapter.listDirectory(),
    staleTime: 60_000,
  });
}
