import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApiAdapter } from '../infrastructure/documents-api.adapter';
import type { UploadDocumentInput } from '../domain/models';

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadDocumentInput) => documentsApiAdapter.upload(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
    },
  });
}
