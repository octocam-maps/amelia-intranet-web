import { useQuery } from '@tanstack/react-query';
import { teamApiAdapter } from '../infrastructure/team-api.adapter';

/** `month` en formato `YYYY-MM`. Alcance fijo al departamento del usuario
 * autenticado — el backend lo resuelve por el token, no admite parámetro. */
export function useTeamCalendar(month: string) {
  return useQuery({
    queryKey: ['team', 'calendar', month],
    queryFn: () => teamApiAdapter.listTeamCalendar(month),
    staleTime: 30_000,
  });
}
