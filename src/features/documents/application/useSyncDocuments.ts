import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApiAdapter } from '../infrastructure/documents-api.adapter';

/** Dispara "Sincronizar ahora" (admin) — concilia Drive → Postgres y
 * refresca el listado, que puede haber cambiado (altas/bajas detectadas). */
export function useSyncDocuments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => documentsApiAdapter.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
    },
  });
}
