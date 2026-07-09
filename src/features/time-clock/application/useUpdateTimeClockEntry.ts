import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';
import type { UpdateTimeClockEntryInput } from '../domain/models';

export function useUpdateTimeClockEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: UpdateTimeClockEntryInput }) =>
      timeClockApiAdapter.update(entryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock', 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
