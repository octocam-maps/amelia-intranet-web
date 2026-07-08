import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useLogout } from '@/features/auth/application/useLogout';
import type { UserRole } from '@/features/auth/domain/models';
import { useStore } from '@/store';
import styles from './Topbar.module.css';

const ROLE_LABEL: Record<UserRole, string> = {
  administrador: 'Administrador',
  empleado: 'Empleado',
  externo_invitado: 'Externo-invitado',
};

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '??';
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Topbar() {
  const user = useStore((s) => s.user);
  const { mutate: logout } = useLogout();

  return (
    <header className={styles.topbar}>
      <DropdownMenu>
        <DropdownMenuTrigger className={styles.trigger}>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.fullName}</p>
            <p className={styles.userRole}>{user ? ROLE_LABEL[user.role] : ''}</p>
          </div>
          <Avatar>
            <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.fullName ?? ''} />
            <AvatarFallback>{initialsOf(user?.fullName)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => logout()}>
            <LogOut className={styles.logoutIcon} />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
