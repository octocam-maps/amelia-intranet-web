import { useMutation, useQueryClient } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { AbsenceTypeInput } from '../domain/models';

export function useCreateAbsenceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AbsenceTypeInput) => absencesApiAdapter.createType(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences', 'types'] });
    },
  });
}
