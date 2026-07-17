import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApiAdapter } from '../infrastructure/invitations-api.adapter';

export function useCancelInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitationsApiAdapter.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'list'] });
      // Cancelar también suspende `users.status` (ver backend
      // `cancel_invitation`) — la fila en "Plantilla" debe reflejarlo.
      queryClient.invalidateQueries({ queryKey: ['staff', 'list'] });
    },
  });
}
