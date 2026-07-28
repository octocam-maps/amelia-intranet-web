import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { useClockIn } from '@/features/time-clock/application/useTimeClockLiveActions';
import { useMarkRead } from '../application/useMarkRead';
import { useNotifications } from '../application/useNotifications';
import type { Notification } from '../domain/models';

/** Tipos de notificación que este pop-up genérico sabe mostrar (decisión
 * post-design, sdd/ampliacion-v11-rrhh/correcciones-post-design #610 punto
 * 3): `clock_in_reminder` (RF-A4.2) y `work_anniversary` (RF3.1, deuda del
 * requerimiento v1.0 — nunca se implementó, ver design #608). */
const POPUP_TYPES = new Set(['clock_in_reminder', 'work_anniversary']);

function isToday(iso: string): boolean {
  const created = new Date(iso);
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
}

/**
 * Pop-up GENÉRICO dirigido por tipo de notificación — sirve a la vez al
 * recordatorio de fichaje (RF-A4.2) y a la felicitación de aniversario
 * laboral (RF3.1). Montado en `AppLayout`, al mismo nivel que `Topbar`.
 *
 * Máximo 1 vez al día por usuario: se apoya en la MISMA notificación que ya
 * trae la garantía de idempotencia del backend (RF-A4.4 / job diario),
 * buscando en la lista YA cacheada por `useNotifications()` (comparte query
 * con la campana — sin petición extra) la primera notificación no leída de
 * alguno de los dos tipos creada HOY. `markRead` fija el "ya se mostró" sin
 * storage nuevo. Trade-off aceptado: si el usuario ficha por el pill del
 * Topbar entre que se creó la notificación y que abre este modal, puede
 * verse una vez de más hasta el siguiente refresh — no se resuelve
 * consultando `time_clock` en vivo (duplicaría lógica).
 */
export function NotificationPopup() {
  const navigate = useNavigate();
  const { data: page } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  // LOGIC-1: `mutateAsync` (no `mutate`) — hay que ESPERAR el resultado real
  // del fichaje antes de descartar el aviso; con "dispara y olvida" el modal
  // se cerraba igual aunque el fichaje fallara (ya fichado, regla de
  // negocio, red caída), y el usuario creía que había fichado sin haberlo
  // hecho.
  const { mutateAsync: clockIn, isPending: isClockingIn } = useClockIn();
  const [clockInError, setClockInError] = useState<string | null>(null);
  // Cierre optimista dentro de esta sesión de render — evita que el pop-up
  // parpadee de nuevo mientras la invalidación de `markRead` todavía no
  // volvió a traer la lista con `read: true`.
  //
  // RACE-1: es un `Set`, no un único id — con dos notificaciones elegibles
  // el mismo día (p. ej. un aniversario laboral coincidiendo con un
  // recordatorio de fichaje), un `useState<string | null>` solo recordaba
  // LA ÚLTIMA descartada: al descartar la segunda se "olvidaba" que la
  // primera ya lo estaba, y como `read` en la caché todavía no había
  // vuelto a `true` (invalidación en vuelo), la primera reaparecía.
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(() => new Set());

  const target = useMemo<Notification | null>(() => {
    const items = page?.items ?? [];
    return (
      items.find(
        (item) =>
          !dismissedIds.has(item.id) &&
          !item.read &&
          POPUP_TYPES.has(item.type) &&
          isToday(item.createdAt),
      ) ?? null
    );
  }, [page, dismissedIds]);

  if (!target) return null;

  function dismiss(notification: Notification) {
    setDismissedIds((prev) => new Set(prev).add(notification.id));
    markRead(notification.id);
  }

  const isAnniversary = target.type === 'work_anniversary';

  // LOGIC-1: solo se descarta la notificación si el fichaje tuvo éxito. Si
  // falla, el modal se queda abierto con un aviso — la notificación sigue
  // sin leer, así que el usuario puede reintentar sin perder el aviso de
  // hoy.
  async function handleClockIn() {
    if (!target) return;
    setClockInError(null);
    try {
      await clockIn();
      dismiss(target);
    } catch {
      setClockInError('No se ha podido registrar el fichaje. Inténtalo de nuevo.');
    }
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && dismiss(target)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{target.title}</DialogTitle>
        </DialogHeader>
        {target.body && <p>{target.body}</p>}
        {clockInError && <p>{clockInError}</p>}
        <DialogFooter>
          {isAnniversary ? (
            <Button
              onClick={() => {
                dismiss(target);
                navigate('/perfil');
              }}
            >
              Ir a mi perfil
            </Button>
          ) : (
            <Button disabled={isClockingIn} onClick={handleClockIn}>
              Fichar ahora
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
