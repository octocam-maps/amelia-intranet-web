import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';
import type { CreateTimeClockEntriesBatchInput } from '../domain/models';

export function useCreateTimeClockEntriesBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTimeClockEntriesBatchInput) => timeClockApiAdapter.createBatch(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock', 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
