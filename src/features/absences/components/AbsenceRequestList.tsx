import { Badge } from '@/components/ui/Badge';
import type { BadgeProps } from '@/components/ui/Badge';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import styles from './AbsenceRequestList.module.css';

const STATUS_LABEL: Record<AbsenceRequest['status'], string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
};

const STATUS_VARIANT: Record<AbsenceRequest['status'], BadgeProps['variant']> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
  cancelled: 'outline',
};

interface AbsenceRequestListProps {
  requests: AbsenceRequest[];
  types: AbsenceType[];
}

export function AbsenceRequestList({ requests, types }: AbsenceRequestListProps) {
  const typeById = new Map(types.map((t) => [t.id, t]));

  if (requests.length === 0) {
    return <p className={styles.empty}>Todavía no has solicitado ninguna ausencia.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Rango</th>
          <th>Días</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr key={request.id}>
            <td>{typeById.get(request.absenceTypeId)?.name ?? '—'}</td>
            <td>
              {request.startDate} → {request.endDate}
            </td>
            <td>{request.daysCount}</td>
            <td>
              <Badge variant={STATUS_VARIANT[request.status]}>{STATUS_LABEL[request.status]}</Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
