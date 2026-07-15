import { useQuery } from '@tanstack/react-query';
import { mailboxApiAdapter } from '../infrastructure/mailbox-api.adapter';
import type { MailboxMessageFilter } from '../domain/models';

/** `enabled` deja que el sidebar consulte el contador de "Sin leer" solo
 * cuando el rol es administrador — evita un 403 de más para el resto. */
export function useMailboxMessages(filter: MailboxMessageFilter = 'all', enabled = true) {
  return useQuery({
    queryKey: ['mailbox', 'messages', filter],
    queryFn: () => mailboxApiAdapter.listMessages(filter),
    staleTime: 15_000,
    enabled,
  });
}
