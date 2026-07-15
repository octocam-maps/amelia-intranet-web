import { useQuery } from '@tanstack/react-query';
import { teamApiAdapter } from '../infrastructure/team-api.adapter';

/** `days`: tamaño de la ventana, incluyendo hoy (por defecto 7 — widget
 * "Cumpleaños esta semana" del Inicio). */
export function useTeamBirthdays(days = 7) {
  return useQuery({
    queryKey: ['team', 'birthdays', days],
    queryFn: () => teamApiAdapter.listBirthdays(days),
    staleTime: 60_000,
  });
}
