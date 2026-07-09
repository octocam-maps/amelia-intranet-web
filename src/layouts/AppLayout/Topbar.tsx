import { Bell, LogOut, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { NewAbsenceRequestDialog } from '@/features/absences/components/NewAbsenceRequestDialog';
import type { UserRole } from '@/features/auth/domain/models';
import { useLogout } from '@/features/auth/application/useLogout';
import { formatHms, useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { useClockIn } from '@/features/time-clock/application/useTimeClockLiveActions';
import { useTimeClockCurrent } from '@/features/time-clock/application/useTimeClockCurrent';
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

/**
 * Franja global de acciones — el pill de fichaje y "Solicitar ausencia" solo
 * tienen sentido para roles con Ausencias/Control horario (administrador y
 * empleado); el externo-invitado no llega aquí con esos módulos, pero por si
 * la respuesta de `/time-clock/current` fallara para su rol, `status` cae al
 * estado "sin fichar" y no se muestra nada roto.
 */
function LiveClockPill() {
  const { data: status } = useTimeClockCurrent();
  const { mutate: clockIn, isPending } = useClockIn();
  const openEntry = status?.openEntry ?? null;
  const elapsedSeconds = useElapsedSeconds(openEntry?.clockIn ?? null, openEntry?.onBreak ?? false);

  if (!openEntry) {
    return (
      <Button variant="dark" size="sm" disabled={isPending} onClick={() => clockIn()}>
        Fichar entrada
      </Button>
    );
  }

  return (
    <>
      <span className={styles.pill} data-on-break={openEntry.onBreak}>
        <span className={styles.pillDot} />
        {formatHms(elapsedSeconds)} · {openEntry.onBreak ? 'En pausa' : 'En jornada'}
      </span>
      <NewAbsenceRequestDialog
        trigger={
          <Button variant="dark" size="sm">
            <Plus />
            Solicitar ausencia
          </Button>
        }
      />
    </>
  );
}

export function Topbar() {
  const user = useStore((s) => s.user);
  const canUseTimeClock = user?.role === 'administrador' || user?.role === 'empleado';
  const { mutate: logout } = useLogout();

  return (
    <header className={styles.topbar}>
      <div className={styles.actions}>
        {canUseTimeClock && <LiveClockPill />}

        <button className={styles.iconButton} type="button" title="Notificaciones (Fase 6)" disabled>
          <Bell className={styles.bellIcon} />
        </button>

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
      </div>
    </header>
  );
}
