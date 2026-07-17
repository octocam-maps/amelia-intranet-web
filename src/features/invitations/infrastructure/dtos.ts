/** Formas tal cual las devuelve el backend (Pydantic) — ver
 * amelia-intranet-back/src/features/invitations/infrastructure/schemas.py. */

export interface InvitationDTO {
  id: string;
  email: string;
  full_name: string | null;
  role_code: string;
  entity_code: string | null;
  invited_by_name: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface InvitationListDTO {
  invitations: InvitationDTO[];
}
