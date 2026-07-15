import { MoreHorizontal, Pencil } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import type { EntityCode, StaffMember, StaffStatus } from '../domain/models';
import styles from './StaffTable.module.css';

const STATUS_LABEL: Record<StaffStatus, string> = {
  activa: 'Activa',
  vacaciones: 'Vacaciones',
  baja: 'Baja',
};

const STATUS_CLASS: Record<StaffStatus, string | undefined> = {
  activa: styles.statusActiva,
  vacaciones: styles.statusVacaciones,
  baja: styles.statusBaja,
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
}

export function StaffTable({ members, isLoading, onEdit, onToggleActive }: StaffTableProps) {
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
        {members.map((member) => (
          <tr key={member.id}>
            <td>
              <div className={styles.person}>
                <Avatar>
                  <AvatarFallback>{initialsOf(member.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className={styles.fullName}>{member.fullName}</p>
                  <p className={styles.email}>{member.email}</p>
                </div>
              </div>
            </td>
            <td>{member.jobTitle}</td>
            <td>
              <Badge variant={ENTITY_BADGE_VARIANT[member.entityCode]}>
                {entityShortLabel(member.entityCode)}
              </Badge>
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
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
