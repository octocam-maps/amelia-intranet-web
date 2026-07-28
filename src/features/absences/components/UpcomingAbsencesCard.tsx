import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { daysUntilLabel } from '../domain/daysUntilLabel';
import { formatAbsenceDateRange } from '../domain/formatAbsenceDateRange';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import { selectUpcomingAbsences } from '../domain/upcomingAbsences';
import { toDateOnly } from '../domain/dateOnly';
import styles from './UpcomingAbsencesCard.module.css';

interface UpcomingAbsencesCardProps {
  requests: AbsenceRequest[];
  types: AbsenceType[];
}

/**
 * "Próximas ausencias" — columna central, debajo del calendario mensual.
 *
 * Es una LISTA a propósito, no un segundo calendario: `AbsenceMonthCalendar`
 * ya pinta el mes en curso, así que un calendario aquí duplicaría la misma
 * información en la misma pantalla. Lo que aporta esta lista es justo lo que
 * el calendario NO da: lo que viene aunque caiga en otro mes, y a cuántos
 * días está.
 */
export function UpcomingAbsencesCard({ requests, types }: UpcomingAbsencesCardProps) {
  // Fecha-only: la cuenta atrás no debe variar según la hora a la que se abra
  // la pantalla (ver `daysUntilLabel`).
  const today = toDateOnly(new Date().toISOString().slice(0, 10));
  const upcoming = selectUpcomingAbsences(requests, today);
  const typeById = new Map(types.map((type) => [type.id, type]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas ausencias</CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className={styles.empty}>No tienes ausencias próximas.</p>
        ) : (
          <ul className={styles.list}>
            {upcoming.map((request) => {
              const type = typeById.get(request.absenceTypeId);
              return (
                <li key={request.id} className={styles.row}>
                  <span
                    className={styles.dot}
                    style={{ backgroundColor: type?.color ?? 'hsl(var(--muted-foreground))' }}
                  />
                  <span className={styles.info}>
                    <span className={styles.name}>{type?.name ?? 'Ausencia'}</span>
                    <span className={styles.range}>
                      {formatAbsenceDateRange(request.startDate, request.endDate)} ·{' '}
                      {request.daysCount} {request.daysCount === 1 ? 'día' : 'días'}
                    </span>
                  </span>
                  <span className={styles.countdown}>
                    {daysUntilLabel(request.startDate, today)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
