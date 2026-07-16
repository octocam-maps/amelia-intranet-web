import { LogOut, Plus } from 'lucide-react';
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
import { useLogout } from '@/features/auth/application/useLogout';
import { formatHms, useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { useClockIn } from '@/features/time-clock/application/useTimeClockLiveActions';
import { useTimeClockCurrent } from '@/features/time-clock/application/useTimeClockCurrent';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { USER_ROLE_LABEL } from '@/features/auth/domain/models';
import { useStore } from '@/store';
import styles from './Topbar.module.css';

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
  // `socio` [migración 024] = igual que empleado -> ficha su propio
  // horario, así que también ve el pill de fichaje (RBAC real en el
  // backend vía `require_role`; esto es solo la composición visual).
  const role = user?.role;
  const canUseTimeClock = role === 'administrador' || role === 'empleado' || role === 'socio';
  const { mutate: logout } = useLogout();

  return (
    <header className={styles.topbar}>
      <div className={styles.actions}>
        {canUseTimeClock && <LiveClockPill />}

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger className={styles.trigger}>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.fullName}</p>
              <p className={styles.userRole}>{user ? USER_ROLE_LABEL[user.role] : ''}</p>
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
