import { useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysApiAdapter } from '../infrastructure/holidays-api.adapter';
import type { HolidayInput } from '../domain/models';

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<HolidayInput> }) =>
      holidaysApiAdapter.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'list'] });
    },
  });
}
