import { useQuery } from '@tanstack/react-query';
import { invitationsApiAdapter } from '../infrastructure/invitations-api.adapter';
import type { InvitationStatus } from '../domain/models';

interface UseInvitationsOptions {
  /** `GET /invitations` es exclusivo del admin (backend `require_role`) —
   * quien llame a este hook fuera de una pantalla admin-only debe pasar
   * `enabled: isAdmin` para no disparar la request y su 403. */
  enabled?: boolean;
}

export function useInvitations(status?: InvitationStatus, options: UseInvitationsOptions = {}) {
  return useQuery({
    queryKey: ['invitations', 'list', status ?? 'all'],
    queryFn: () => invitationsApiAdapter.list(status),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}
