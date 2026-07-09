import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mailboxApiAdapter } from '../infrastructure/mailbox-api.adapter';

export function useResolveMailboxMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => mailboxApiAdapter.resolveMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailbox', 'messages'] });
    },
  });
}
