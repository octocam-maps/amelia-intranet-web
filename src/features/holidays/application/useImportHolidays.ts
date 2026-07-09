import { useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysApiAdapter } from '../infrastructure/holidays-api.adapter';

export function useImportHolidays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (year: number) => holidaysApiAdapter.importOfficial(year),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays', 'list'] });
    },
  });
}
