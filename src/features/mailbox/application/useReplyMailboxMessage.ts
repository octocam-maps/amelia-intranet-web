import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mailboxApiAdapter } from '../infrastructure/mailbox-api.adapter';
import type { ReplyToMailboxMessageInput } from '../domain/models';

export function useReplyMailboxMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, input }: { messageId: string; input: ReplyToMailboxMessageInput }) =>
      mailboxApiAdapter.replyToMessage(messageId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailbox', 'messages'] });
    },
  });
}
