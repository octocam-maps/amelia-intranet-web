import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffApiAdapter } from '../infrastructure/staff-api.adapter';
import type { UpdateStaffMemberInput } from '../domain/models';

export function useUpdateStaffMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateStaffMemberInput }) =>
      staffApiAdapter.update(id, input),
    onSuccess: (_member, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
      // Un PATCH que cambia el rol escribe una fila en `user_role_history`
      // (migración 039). Sin invalidar esta clave, el timeline de la ficha se
      // queda con el historial de antes del cambio y parece que no pasó nada:
      // su `staleTime` son 5 minutos precisamente porque solo cambia aquí.
      queryClient.invalidateQueries({ queryKey: ['staff', 'role-history', id] });
    },
  });
}
