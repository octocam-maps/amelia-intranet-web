import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApiAdapter } from '../infrastructure/documents-api.adapter';

/**
 * Pasada EN SECO del volcado de carpetas.
 *
 * Es una `useMutation` y no una `useQuery` a pesar de ser un `GET`: no
 * queremos que se dispare sola al montar la página ni que TanStack la
 * refresque por su cuenta. Consulta ~40 veces a Drive, y debe ocurrir
 * exactamente cuando el administrador pulsa el botón — ni antes, ni otra vez
 * al volver a enfocar la pestaña.
 */
export function usePlanFolders() {
  return useMutation({
    mutationFn: () => documentsApiAdapter.planFolders(),
  });
}

/** Crea el árbol de carpetas en Drive. Idempotente: re-ejecutarlo es el
 * mecanismo de reintento si una tanda quedó a medias. */
export function useProvisionFolders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => documentsApiAdapter.provisionFolders(),
    onSuccess: () => {
      // El volcado no crea documentos, pero sí cachea `drive_folder_id` en
      // cada usuario; el listado de personal lo refleja en otras vistas.
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
}
