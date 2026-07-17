import { useQuery } from '@tanstack/react-query';
import { documentsApiAdapter } from '../infrastructure/documents-api.adapter';
import type { ListDocumentsParams } from '../domain/models';

export function useDocuments(params: ListDocumentsParams = {}) {
  return useQuery({
    queryKey: ['documents', 'list', params],
    queryFn: () => documentsApiAdapter.list(params),
    staleTime: 15_000,
  });
}
