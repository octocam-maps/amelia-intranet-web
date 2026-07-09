import { useMutation, useQueryClient } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { AbsenceTypeInput } from '../domain/models';

export function useUpdateAbsenceType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AbsenceTypeInput> }) =>
      absencesApiAdapter.updateType(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences', 'types'] });
    },
  });
}
