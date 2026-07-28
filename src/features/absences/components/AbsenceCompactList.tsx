import { CheckCircledIcon, ClockIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import type { IconComponent } from '@/components/icons';
import { formatAbsenceDateRange } from '../domain/formatAbsenceDateRange';
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

interface AbsenceCompactListProps {
  requests: AbsenceRequest[];
  types: AbsenceType[];
  /** "Mis solicitudes" (`AbsenceRequestsTabs`) reutiliza esta lista en 3
   * pestañas, cada una con su propio mensaje vacío en vez del genérico de
   * abajo. */
  emptyMessage?: string;
}

/** "Mis ausencias" del deck 03-ausencias-empleado — fila con punto de color
 * del tipo + rango + días, e icono de estado (check/reloj/x) en vez del
 * badge de texto que usa la tabla completa de la página de admin. */
export function AbsenceCompactList({
  requests,
  types,
  emptyMessage = 'Todavía no has solicitado ninguna ausencia.',
}: AbsenceCompactListProps) {
  const typeById = new Map(types.map((t) => [t.id, t]));

  if (requests.length === 0) {
    return <p className={styles.empty}>{emptyMessage}</p>;
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
                {formatAbsenceDateRange(request.startDate, request.endDate)} · {request.daysCount}{' '}
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
