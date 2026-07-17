import { useMutation } from '@tanstack/react-query';
import { mailboxApiAdapter } from '../infrastructure/mailbox-api.adapter';

/**
 * Consulta manual por `reference_code` (`GET /mailbox/track/...`). Es una
 * `mutation`, no una `query`, a propósito: no hay un `referenceCode` que
 * cachear entre renders (lo escribe el emisor cada vez) y el disparo es
 * siempre un submit explícito, nunca automático al montar la pantalla.
 */
export function useTrackMailboxMessage() {
  return useMutation({
    mutationFn: (referenceCode: string) => mailboxApiAdapter.trackMessage(referenceCode),
  });
}
