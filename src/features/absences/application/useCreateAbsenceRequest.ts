import { useMutation, useQueryClient } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { CreateAbsenceRequestInput } from '../domain/models';

export function useCreateAbsenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAbsenceRequestInput) => absencesApiAdapter.createRequest(input),
    onSuccess: () => {
      // El saldo cambia de inmediato (pending_days sube) y aparece en la
      // bandeja del admin — invalidamos ambas cachés, no solo la propia lista.
      queryClient.invalidateQueries({ queryKey: ['absences', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['absences', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
