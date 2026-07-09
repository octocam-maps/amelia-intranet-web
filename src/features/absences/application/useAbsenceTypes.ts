import { useQuery } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';

export function useAbsenceTypes() {
  return useQuery({
    queryKey: ['absences', 'types'],
    queryFn: () => absencesApiAdapter.listTypes(),
    staleTime: 5 * 60_000, // catálogo casi estático — lo edita el admin en Fase 5
  });
}
