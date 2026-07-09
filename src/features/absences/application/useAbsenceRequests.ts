import { useQuery } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { ListAbsenceRequestsMode } from '../domain/models';

export function useAbsenceRequests(params: { mode?: ListAbsenceRequestsMode; userId?: string } = {}) {
  return useQuery({
    queryKey: ['absences', 'requests', params],
    queryFn: () => absencesApiAdapter.listRequests(params),
    staleTime: 15_000,
  });
}
