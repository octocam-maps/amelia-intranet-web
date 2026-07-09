import { useMemo } from 'react';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import styles from './AbsenceCalendar.module.css';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function toDateOnly(iso: string): Date {
  const parts = iso.split('-').map(Number);
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return new Date(year, month - 1, day);
}

function isWithinRange(day: Date, request: AbsenceRequest): boolean {
  const start = toDateOnly(request.startDate);
  const end = toDateOnly(request.endDate);
  return day >= start && day <= end;
}

interface AbsenceCalendarProps {
  requests: AbsenceRequest[];
  types: AbsenceType[];
}

/**
 * Calendario visual del mes en curso — marca los días cubiertos por alguna
 * solicitud propia (color del tipo, atenuado mientras sigue `pending`). Es
 * deliberadamente simple (grid nativo, sin librería de calendario nueva);
 * si Fase 5 pide navegación entre meses o el calendario global del admin,
 * se amplía sin tocar el resto del feature.
 */
export function AbsenceCalendar({ requests, types }: AbsenceCalendarProps) {
  const typeById = new Map(types.map((t) => [t.id, t]));

  const cells = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // getDay(): 0 = domingo ... 6 = sábado. Se reordena para que la semana empiece en lunes.
    const leadingBlanks = (firstDay.getDay() + 6) % 7;

    const result: Array<Date | null> = [];
    for (let i = 0; i < leadingBlanks; i += 1) result.push(null);
    for (let day = 1; day <= lastDay.getDate(); day += 1) result.push(new Date(year, month, day));
    return result;
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.weekdays}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className={styles.weekday}>
            {label}
          </span>
        ))}
      </div>
      <div className={styles.grid}>
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} className={styles.cell} />;

          const matchingRequest = requests.find((request) => isWithinRange(date, request));
          const type = matchingRequest ? typeById.get(matchingRequest.absenceTypeId) : undefined;

          return (
            <span
              key={date.toISOString()}
              className={styles.cell}
              style={
                matchingRequest
                  ? {
                      backgroundColor: type?.color ?? 'hsl(var(--secondary))',
                      opacity: matchingRequest.status === 'pending' ? 0.45 : 0.85,
                      color: '#fff',
                    }
                  : undefined
              }
              title={matchingRequest ? `${type?.name ?? ''} (${matchingRequest.status})` : undefined}
            >
              {date.getDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}
