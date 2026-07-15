import { useQuery } from '@tanstack/react-query';
import { holidaysApiAdapter } from '../infrastructure/holidays-api.adapter';
import type { HolidayListParams } from '../domain/models';

export function useHolidays(params: HolidayListParams = {}) {
  return useQuery({
    queryKey: ['holidays', 'list', params],
    queryFn: () => holidaysApiAdapter.list(params),
    staleTime: 60_000,
  });
}
