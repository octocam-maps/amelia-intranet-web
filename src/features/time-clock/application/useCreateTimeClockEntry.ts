import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';
import type { CreateTimeClockEntryInput } from '../domain/models';

export function useCreateTimeClockEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTimeClockEntryInput) => timeClockApiAdapter.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock', 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
