import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApiAdapter } from '../infrastructure/invitations-api.adapter';

export function useResendInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitationsApiAdapter.resend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'list'] });
    },
  });
}
