import { CheckCircledIcon, ClockIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import type { IconComponent } from '@/components/icons';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import styles from './AbsenceCompactList.module.css';

const STATUS_ICON: Record<AbsenceRequest['status'], IconComponent> = {
  approved: CheckCircledIcon,
  pending: ClockIcon,
  rejected: CrossCircledIcon,
  cancelled: CrossCircledIcon,
};

const STATUS_ICON_CLASS: Record<AbsenceRequest['status'], string | undefined> = {
  approved: styles.iconApproved,
  pending: styles.iconPending,
  rejected: styles.iconRejected,
  cancelled: styles.iconRejected,
};

function formatRange(startDate: string, endDate: string): string {
  const format = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
  return startDate === endDate ? format(startDate) : `${format(startDate)} → ${format(endDate)}`;
}

interface AbsenceCompactListProps {
  requests: AbsenceRequest[];
  types: AbsenceType[];
}

/** "Mis ausencias" del deck 03-ausencias-empleado — fila con punto de color
 * del tipo + rango + días, e icono de estado (check/reloj/x) en vez del
 * badge de texto que usa la tabla completa de la página de admin. */
export function AbsenceCompactList({ requests, types }: AbsenceCompactListProps) {
  const typeById = new Map(types.map((t) => [t.id, t]));

  if (requests.length === 0) {
    return <p className={styles.empty}>Todavía no has solicitado ninguna ausencia.</p>;
  }

  return (
    <ul className={styles.list}>
      {requests.map((request) => {
        const type = typeById.get(request.absenceTypeId);
        const StatusIcon = STATUS_ICON[request.status];
        return (
          <li key={request.id} className={styles.row}>
            <span className={styles.dot} style={{ backgroundColor: type?.color ?? undefined }} />
            <div className={styles.info}>
              <p className={styles.type}>{type?.name ?? '—'}</p>
              <p className={styles.range}>
                {formatRange(request.startDate, request.endDate)} · {request.daysCount}{' '}
                {request.daysCount === 1 ? 'día' : 'días'}
              </p>
            </div>
            <StatusIcon className={STATUS_ICON_CLASS[request.status]} />
          </li>
        );
      })}
    </ul>
  );
}
