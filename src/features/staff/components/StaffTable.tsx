import { MoreHorizontal, Pencil } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import type { Invitation } from '@/features/invitations/domain/models';
import { cn } from '@/lib/utils';
import type { EntityCode, StaffMember, StaffStatus } from '../domain/models';
import styles from './StaffTable.module.css';

const STATUS_LABEL: Record<StaffStatus, string> = {
  active: 'Activo',
  invited: 'Invitado',
  suspended: 'Suspendido',
};

const STATUS_CLASS: Record<StaffStatus, string | undefined> = {
  active: styles.statusActive,
  invited: styles.statusInvited,
  suspended: styles.statusSuspended,
};

// deck-fase6/09-plantilla-listado.png — esta tabla usa una paleta de
// entidad distinta a la del directorio de Equipo (Fase 5, `TeamDirectory`):
// aquí Hub va en gris neutro y Lab en verde. Se respeta el deck de esta
// fase en vez de forzar la paleta de Fase 5.
const ENTITY_BADGE_VARIANT: Record<EntityCode, 'outline' | 'success' | 'warning'> = {
  hub: 'outline',
  lab: 'success',
  ops: 'warning',
};

function entityShortLabel(code: EntityCode): string {
  return code.charAt(0).toUpperCase() + code.slice(1);
}

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface StaffTableProps {
  members: StaffMember[];
  isLoading: boolean;
  onEdit: (member: StaffMember) => void;
  onToggleActive: (member: StaffMember) => void;
  /** Invitación pendiente asociada, si la hay — clave por email en
   * minúsculas (ver `StaffPage`). Solo aporta datos para `status ===
   * 'invited'`; si no hay entrada (p. ej. altas anteriores a este feature),
   * se degrada a mostrar solo el estado, sin badge ni acciones de
   * invitación. */
  pendingInvitationByEmail: Map<string, Invitation>;
  onResendInvitation: (invitation: Invitation) => void;
  onCancelInvitation: (invitation: Invitation) => void;
}

export function StaffTable({
  members,
  isLoading,
  onEdit,
  onToggleActive,
  pendingInvitationByEmail,
  onResendInvitation,
  onCancelInvitation,
}: StaffTableProps) {
  if (isLoading) {
    return <p className={styles.empty}>Cargando plantilla…</p>;
  }
  if (members.length === 0) {
    return <p className={styles.empty}>No se ha encontrado a nadie con ese criterio.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Persona</th>
          <th>Puesto</th>
          <th>Entidad</th>
          <th>Estado</th>
          <th aria-label="Acciones" />
        </tr>
      </thead>
      <tbody>
        {members.map((member) => {
          // Solo aplica a `status === 'invited'` — y solo si el backend ya
          // dejó traza en `invitations` (ver `StaffPage`: altas anteriores
          // a este feature no tienen invitación asociada).
          const invitation =
            member.status === 'invited'
              ? pendingInvitationByEmail.get(member.email.toLowerCase())
              : undefined;

          return (
            <tr key={member.id}>
              <td>
                <div className={styles.person}>
                  <Avatar>
                    <AvatarFallback>{initialsOf(member.fullName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className={styles.fullName}>{member.fullName}</p>
                    <p className={styles.email}>{member.email}</p>
                    {invitation && (
                      <Badge variant="warning" className={styles.pendingBadge}>
                        Invitación pendiente
                      </Badge>
                    )}
                  </div>
                </div>
              </td>
              <td>{member.jobTitle ?? '—'}</td>
              <td>
                {member.entityCode ? (
                  <Badge variant={ENTITY_BADGE_VARIANT[member.entityCode]}>
                    {entityShortLabel(member.entityCode)}
                  </Badge>
                ) : (
                  <Badge variant="outline">Sin entidad</Badge>
                )}
              </td>
              <td>
                <span className={cn(styles.status, STATUS_CLASS[member.status])}>
                  <span className={styles.statusDot} />
                  {STATUS_LABEL[member.status]}
                </span>
              </td>
              <td>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => onEdit(member)}
                    aria-label={`Editar a ${member.fullName}`}
                  >
                    <Pencil />
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className={styles.iconButton} aria-label={`Más acciones para ${member.fullName}`}>
                        <MoreHorizontal />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onEdit(member)}>Editar persona</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleActive(member)}>
                        {member.isActive ? 'Desactivar acceso' : 'Reactivar acceso'}
                      </DropdownMenuItem>
                      {invitation && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onResendInvitation(invitation)}>
                            Reenviar invitación
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onCancelInvitation(invitation)}>
                            Cancelar invitación
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
