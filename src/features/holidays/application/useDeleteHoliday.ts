import { useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysApiAdapter } from '../infrastructure/holidays-api.adapter';

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => holidaysApiAdapter.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'list'] });
    },
  });
}
