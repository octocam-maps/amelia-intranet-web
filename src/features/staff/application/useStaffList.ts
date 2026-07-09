import { useQuery } from '@tanstack/react-query';
import { staffApiAdapter } from '../infrastructure/staff-api.adapter';
import type { StaffListParams } from '../domain/models';

export function useStaffList(params: StaffListParams = {}) {
  return useQuery({
    queryKey: ['staff', 'list', params],
    queryFn: () => staffApiAdapter.list(params),
    staleTime: 30_000,
  });
}
