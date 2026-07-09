import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useReviewAbsenceRequest } from '../application/useReviewAbsenceRequest';
import styles from './AbsenceApprovalList.module.css';

/** Forma mínima que necesita esta lista — la trae ya enriquecida
 * `dashboard/summary` (con `userFullName`, que `/absences/requests/pending`
 * no incluye). Se declara aquí en vez de importar el DTO del feature
 * `dashboard` para no acoplar `absences` a su dominio. */
export interface ApprovableAbsenceRequest {
  id: string;
  userFullName: string;
  absenceTypeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
}

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDay(iso: string): { day: string; month: string } {
  const date = new Date(`${iso}T00:00:00`);
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
  };
}

interface AbsenceApprovalListProps {
  requests: ApprovableAbsenceRequest[];
  /** El deck 05-ausencias-admin añade un filtro por tipo; el widget del
   * home (02-home-admin-bandeja) no lo necesita. */
  filterable?: boolean;
}

export function AbsenceApprovalList({ requests, filterable = false }: AbsenceApprovalListProps) {
  const { mutate: review, isPending } = useReviewAbsenceRequest();
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const typeNames = useMemo(
    () => Array.from(new Set(requests.map((r) => r.absenceTypeName))),
    [requests]
  );
  const filtered = typeFilter ? requests.filter((r) => r.absenceTypeName === typeFilter) : requests;

  return (
    <div className={styles.root}>
      {filterable && typeNames.length > 0 && (
        <div className={styles.filters}>
          <button
            type="button"
            className={cn(styles.filterPill, !typeFilter && styles.filterPillActive)}
            onClick={() => setTypeFilter(null)}
          >
            Todas
          </button>
          {typeNames.map((name) => (
            <button
              key={name}
              type="button"
              className={cn(styles.filterPill, typeFilter === name && styles.filterPillActive)}
              onClick={() => setTypeFilter(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className={styles.empty}>No hay solicitudes pendientes de revisión.</p>
      ) : (
        <ul className={styles.list}>
          {filtered.map((request) => {
            const { day, month } = formatDay(request.startDate);
            return (
              <li key={request.id} className={styles.row}>
                <span className={styles.date}>
                  {month}
                  <span className={styles.dateNumber}>{day}</span>
                </span>
                <Avatar className={styles.avatar}>
                  <AvatarFallback>{initialsOf(request.userFullName)}</AvatarFallback>
                </Avatar>
                <span className={styles.name}>{request.userFullName}</span>
                <span className={styles.days}>{request.daysCount} días</span>
                <span className={styles.type}>{request.absenceTypeName}</span>
                <Button
                  variant="outline"
                  size="icon"
                  // Inline en vez de clase: `variantOutline` de Button.module.css
                  // también fija `color`, y dos clases con la misma especificidad
                  // dependen del orden de carga del CSS — el inline siempre gana.
                  style={{ color: 'hsl(var(--destructive))' }}
                  disabled={isPending}
                  onClick={() => review({ requestId: request.id, input: { decision: 'rejected' } })}
                  aria-label="Rechazar"
                >
                  <X />
                </Button>
                <Button
                  size="icon"
                  disabled={isPending}
                  onClick={() => review({ requestId: request.id, input: { decision: 'approved' } })}
                  aria-label="Aprobar"
                >
                  <Check />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
