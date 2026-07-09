import { useQuery } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';
import type { ListTimeClockEntriesParams } from '../domain/models';

export function useTimeClockEntries(params: ListTimeClockEntriesParams) {
  return useQuery({
    queryKey: ['time-clock', 'entries', params],
    queryFn: () => timeClockApiAdapter.list(params),
    staleTime: 30_000,
  });
}
