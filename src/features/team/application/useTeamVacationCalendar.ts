import { useQuery } from '@tanstack/react-query';
import { teamApiAdapter } from '../infrastructure/team-api.adapter';

/** `month` en formato `YYYY-MM`. */
export function useTeamVacationCalendar(month: string) {
  return useQuery({
    queryKey: ['team', 'vacation-calendar', month],
    queryFn: () => teamApiAdapter.listVacationCalendar(month),
    staleTime: 30_000,
  });
}
