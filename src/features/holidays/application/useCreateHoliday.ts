import { useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysApiAdapter } from '../infrastructure/holidays-api.adapter';
import type { HolidayInput } from '../domain/models';

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: HolidayInput) => holidaysApiAdapter.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'list'] });
    },
  });
}
