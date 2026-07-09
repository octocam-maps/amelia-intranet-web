import { useMutation } from '@tanstack/react-query';
import { mailboxApiAdapter } from '../infrastructure/mailbox-api.adapter';
import type { CreateMailboxMessageInput } from '../domain/models';

/** Sin invalidación de caché: quien envía el mensaje es anónimo y no
 * consulta la bandeja — no hay ninguna query propia que refrescar. */
export function useCreateMailboxMessage() {
  return useMutation({
    mutationFn: (input: CreateMailboxMessageInput) => mailboxApiAdapter.createMessage(input),
  });
}
