import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApiAdapter } from '../infrastructure/documents-api.adapter';

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApiAdapter.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
    },
  });
}
