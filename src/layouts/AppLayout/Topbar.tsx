import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/features/auth/application/useLogout';
import type { UserRole } from '@/features/auth/domain/models';
import { useStore } from '@/store';

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
    <header className="flex h-16 items-center justify-end border-b border-border bg-card px-6">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-md px-2 py-1.5 outline-none hover:bg-muted">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground">{user ? ROLE_LABEL[user.role] : ''}</p>
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
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
