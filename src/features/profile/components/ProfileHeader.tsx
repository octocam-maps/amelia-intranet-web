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

const ROLE_BADGE_VARIANT: Record<UserRole, 'dark' | 'success' | 'outline'> = {
  administrador: 'dark',
  empleado: 'success',
  externo_invitado: 'outline',
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
  return (
    <div className={styles.root}>
      <Avatar className={styles.avatar}>
        {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />}
        <AvatarFallback className={styles.fallback}>{initialsOf(profile.fullName)}</AvatarFallback>
      </Avatar>

      <div className={styles.identity}>
        <div className={styles.nameRow}>
          <h1 className={styles.name}>{profile.fullName}</h1>
          <Badge variant={ROLE_BADGE_VARIANT[profile.role]}>{ROLE_LABEL[profile.role]}</Badge>
        </div>
        <p className={styles.jobTitle}>{profile.jobTitle ?? '—'}</p>
      </div>
    </div>
  );
}
