import type { UserRole } from '@/features/auth/domain/models';

/** Mismo contrato que `staff/domain/models.ts` (`EntityCode`) — duplicado
 * a propósito para no acoplar features (mismo criterio que `normalize()`
 * en `StaffPage`/`TeamDirectory`). */
export type EntityCode = 'hub' | 'lab' | 'ops';

/** `invitations.status` (CHECK de la tabla) — en la práctica hoy solo se
 * observan `'pending'`/`'revoked'`: `'accepted'` nunca se llega a escribir
 * en el alta EAGER actual (deuda conocida, ver backend
 * `invitations/domain/ports.py`) y nada pone `'expired'` todavía. */
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface Invitation {
  id: string;
  email: string;
  /** `null` solo si la fila `users` de la persona invitada desapareciera
   * (no debería pasar hoy: el alta es EAGER). */
  fullName: string | null;
  role: UserRole;
  entityCode: EntityCode | null;
  /** Nombre de quien dio de alta (`invitations.invited_by`). */
  invitedByName: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}
