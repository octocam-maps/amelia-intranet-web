import { useMemo, type RefObject } from 'react';
import { ExitIcon, HamburgerMenuIcon, PlusIcon } from '@radix-ui/react-icons';
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
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store';
import { NAV_BY_ROLE, pageTitleForPath } from './nav-config';
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
    // `outline`, no `dark`: en Inicio y en Control horario, `LiveClockCard`
    // pinta la MISMA acción con `dark`, y dos acciones primarias visibles a la
    // vez dejan al usuario sin saber cuál es el camino esperado. La primaria es
    // la de la página; esta es el atajo persistente desde cualquier vista.
    return (
      <Button variant="outline" size="sm" disabled={isPending} onClick={() => clockIn()}>
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
            <PlusIcon />
            Solicitar ausencia
          </Button>
        }
      />
    </>
  );
}

interface TopbarProps {
  /** Ref del botón hamburguesa — `AppLayout` le devuelve el foco al cerrar
   * el drawer (Escape / overlay). */
  menuButtonRef?: RefObject<HTMLButtonElement>;
  isMobileNavOpen: boolean;
  onToggleMobileNav: () => void;
}

export function Topbar({ menuButtonRef, isMobileNavOpen, onToggleMobileNav }: TopbarProps) {
  const user = useStore((s) => s.user);
  const role = user?.role;
  // El pill de fichaje se muestra si el rol tiene "Control horario" en su
  // navbar (NAV_BY_ROLE) — misma fuente de verdad que el sidebar, para no
  // reenumerar a mano qué roles fichan. El RBAC real vive en el backend
  // (`require_role`); esto es solo la composición visual. El externo, que no
  // tiene el módulo, queda fuera automáticamente (igual que `socio` lo incluye).
  const canUseTimeClock = !!role && NAV_BY_ROLE[role].some((item) => item.to === '/control-horario');
  const { mutate: logout } = useLogout();

  // Encabezado contextual (izquierda del header): en qué sección estás + fecha.
  // El título sale de `pageTitleForPath` (mismo mapa de navegación que el
  // sidebar), no de una tabla propia. La fecha se calcula una vez por montaje.
  const { pathname } = useLocation();
  const pageTitle = pageTitleForPath(pathname, role);
  const todayLabel = useMemo(() => {
    const formatted = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {/* Solo visible <=768px (Topbar.module.css) — en escritorio el
            sidebar ya está siempre visible, no hace falta abrirlo. */}
        <button
          ref={menuButtonRef}
          type="button"
          className={styles.menuButton}
          aria-label={isMobileNavOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={isMobileNavOpen}
          onClick={onToggleMobileNav}
        >
          <HamburgerMenuIcon />
        </button>

        {pageTitle && (
          <div className={styles.pageHeading}>
            {/* Es el <h1> REAL de la vista, no un rótulo decorativo: las páginas
                repetían este mismo texto en su propio <h1> justo debajo
                ("Documentos" arriba y "Documentos" otra vez en el contenido),
                así que se retiró el de las páginas y el encabezado del documento
                vive aquí — un único <h1> por vista, como espera un lector de
                pantalla. */}
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
            <span className={styles.pageDate}>{todayLabel}</span>
          </div>
        )}
      </div>

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
              {/* Sin `alt`: `AvatarImage` ya lo pone vacío por defecto, porque
                  el avatar es decorativo siempre que el nombre esté al lado
                  (aquí, en `.userName`). Ver el docstring del componente. */}
              <AvatarImage src={user?.avatarUrl ?? undefined} />
              <AvatarFallback>{initialsOf(user?.fullName)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout()}>
              <ExitIcon className={styles.logoutIcon} />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
