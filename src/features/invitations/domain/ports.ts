import type { Invitation, InvitationStatus } from './models';

export interface InvitationRepository {
  /** `GET /invitations` — exclusivo del admin (backend `require_role`). */
  list(status?: InvitationStatus): Promise<Invitation[]>;
  /** `POST /invitations/{id}/resend`. */
  resend(id: string): Promise<Invitation>;
  /** `POST /invitations/{id}/cancel`. */
  cancel(id: string): Promise<Invitation>;
}
