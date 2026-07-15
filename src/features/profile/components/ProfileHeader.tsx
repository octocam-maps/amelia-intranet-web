import type { CSSProperties } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { UserRole } from '@/features/auth/domain/models';
import type { UserProfile } from '../domain/models';
import styles from './ProfileHeader.module.css';

// docs/brief-diseno.md § C8 "Mi perfil" — tres roles de producto, mismas
// etiquetas legibles que docs/permisos-roles.md.
const ROLE_LABEL: Record<UserRole, string> = {
  administrador: 'Administrador',
  empleado: 'Empleado',
  externo_invitado: 'Externo-invitado',
};

// El hero es navy (`--header-bg`), así que las variantes de Badge pensadas
// para tarjeta blanca ('dark' == el propio fondo, 'outline' == texto oscuro)
// quedarían invisibles aquí. Se fuerza un chip translúcido legible sobre
// fondo oscuro para los tres roles, en vez de heredar la semántica de color
// por rol (que solo tiene sentido sobre superficie clara).
const ROLE_BADGE_STYLE: CSSProperties = {
  backgroundColor: 'hsl(var(--header-foreground) / 0.14)',
  color: 'hsl(var(--header-foreground))',
  borderColor: 'hsl(var(--header-foreground) / 0.24)',
};

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface ProfileHeaderProps {
  profile: UserProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  // deck-fase3 § "Mi perfil" no define un hero propio: se sigue el mismo
  // criterio visual navy del header de la app (`--header-bg`) para dar
  // jerarquía a la cabecera sin inventar un patrón nuevo.
  const affiliationParts = [profile.entityName, profile.departmentName].filter(
    (part): part is string => Boolean(part)
  );

  return (
    <div className={styles.root}>
      <Avatar className={styles.avatar}>
        {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />}
        <AvatarFallback className={styles.fallback}>{initialsOf(profile.fullName)}</AvatarFallback>
      </Avatar>

      <div className={styles.identity}>
        <div className={styles.nameRow}>
          <h1 className={styles.name}>{profile.fullName}</h1>
          <Badge variant="outline" style={ROLE_BADGE_STYLE}>
            {ROLE_LABEL[profile.role]}
          </Badge>
        </div>
        <p className={styles.jobTitle}>{profile.jobTitle ?? '—'}</p>
        {affiliationParts.length > 0 && (
          <p className={styles.affiliation}>{affiliationParts.join(' · ')}</p>
        )}
      </div>
    </div>
  );
}
