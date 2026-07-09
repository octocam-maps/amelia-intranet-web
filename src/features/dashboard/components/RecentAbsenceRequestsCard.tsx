import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import type { BadgeProps } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAbsenceRequests } from '@/features/absences/application/useAbsenceRequests';
import { useAbsenceTypes } from '@/features/absences/application/useAbsenceTypes';
import type { AbsenceRequest } from '@/features/absences/domain/models';
import styles from './RecentAbsenceRequestsCard.module.css';

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

function formatDay(iso: string): { day: string; month: string } {
  const date = new Date(`${iso}T00:00:00`);
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
  };
}

/** "Mis solicitudes de ausencia" del deck 01-home-empleado — las 3 más
 * recientes, con enlace a la página completa (`/ausencias`). */
export function RecentAbsenceRequestsCard() {
  const { data: requests = [] } = useAbsenceRequests({ mode: 'own' });
  const { data: types = [] } = useAbsenceTypes();
  const typeById = new Map(types.map((t) => [t.id, t]));
  const recent = requests.slice(0, 3);

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Mis solicitudes de ausencia</CardTitle>
        <Link to="/ausencias" className={styles.link}>
          Ver todas
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className={styles.empty}>Todavía no has solicitado ninguna ausencia.</p>
        ) : (
          <ul className={styles.list}>
            {recent.map((request) => {
              const type = typeById.get(request.absenceTypeId);
              const { day, month } = formatDay(request.startDate);
              return (
                <li key={request.id} className={styles.row}>
                  <span className={styles.date}>
                    {month}
                    <span className={styles.dateNumber}>{day}</span>
                  </span>
                  <span className={styles.type}>
                    <span className={styles.dot} style={{ backgroundColor: type?.color ?? undefined }} />
                    {request.startDate} → {request.endDate}
                    <span className={styles.typeName}>{type?.name ?? '—'}</span>
                  </span>
                  <span className={styles.days}>{request.daysCount} días</span>
                  <Badge variant={STATUS_VARIANT[request.status]}>{STATUS_LABEL[request.status]}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
