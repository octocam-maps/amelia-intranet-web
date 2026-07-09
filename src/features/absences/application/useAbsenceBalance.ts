import { useQuery } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';

export function useAbsenceBalance(params: { userId?: string; year?: number } = {}) {
  return useQuery({
    queryKey: ['absences', 'balance', params],
    queryFn: () => absencesApiAdapter.getBalance(params),
    staleTime: 15_000, // contador "en tiempo real" — refresco corto
  });
}
