import type { UserRole } from '@/features/auth/domain/models';

// `EntityCode` es del módulo canónico `lib/entities`, no de esta feature: la
// lista estaba duplicada en cinco y añadir la cuarta sociedad obligaba a
// acordarse de todas. Se importa Y se reexporta para que los consumidores
// actuales sigan importándolo desde aquí sin cambios.
import type { EntityCode } from '@/lib/entities';

export type { EntityCode };

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
