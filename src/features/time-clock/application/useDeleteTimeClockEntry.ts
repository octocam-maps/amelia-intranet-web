import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';

export function useDeleteTimeClockEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => timeClockApiAdapter.remove(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock', 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
