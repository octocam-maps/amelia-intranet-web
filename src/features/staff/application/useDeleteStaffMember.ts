import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApiAdapter } from '../infrastructure/staff-api.adapter';

/**
 * Baja DEFINITIVA de una persona (borrado lógico con anonimización).
 *
 * Invalida bastante más que la lista de plantilla: la persona desaparece del
 * directorio, del organigrama y del calendario del equipo, y sus datos de
 * perfil dejan de existir. Invalidar solo `['staff','list']` dejaría el resto
 * de pantallas mostrándola hasta el siguiente refresco, que es justo el
 * síntoma que hace dudar de si el borrado funcionó.
 */
export function useDeleteStaffMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApiAdapter.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['team'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
