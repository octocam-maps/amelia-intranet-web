import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { UpcomingHoliday } from '@/features/dashboard/domain/models';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import styles from './AbsenceYearCalendar.module.css';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function toDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithinRange(day: Date, request: AbsenceRequest): boolean {
  const start = toDateOnly(request.startDate);
  const end = toDateOnly(request.endDate);
  return day >= start && day <= end;
}

function monthCells(year: number, month: number): Array<Date | null> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // getDay(): 0 = domingo ... 6 = sábado. Se reordena para que la semana empiece en lunes.
  const leadingBlanks = (firstDay.getDay() + 6) % 7;
  const result: Array<Date | null> = [];
  for (let i = 0; i < leadingBlanks; i += 1) result.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) result.push(new Date(year, month, day));
  return result;
}

interface AbsenceYearCalendarProps {
  requests: AbsenceRequest[];
  types: AbsenceType[];
  holidays: UpcomingHoliday[];
}

/**
 * Calendario ANUAL (12 mini-meses) — a pedido explícito del usuario, ocupa
 * TODO el espacio disponible de la columna en vez de quedar vacío como en
 * el mockup 03-ausencias-empleado. Grid nativo, sin librería de calendario.
 * Los festivos solo cubren los "próximos" que trae `dashboard/summary`
 * (Fase 5 no tiene todavía un endpoint de festivos del año completo).
 */
export function AbsenceYearCalendar({ requests, types, holidays }: AbsenceYearCalendarProps) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const today = new Date();

  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);
  const holidayDates = useMemo(() => holidays.map((h) => toDateOnly(h.day)), [holidays]);
  const vacacionesColor = types.find((t) => t.code === 'vacaciones')?.color ?? 'hsl(var(--warning))';
  const remotoColor = types.find((t) => t.code === 'remoto')?.color ?? 'hsl(var(--info))';

  return (
    <Card className={styles.cardFill}>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Calendario {year}</CardTitle>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: vacacionesColor }} />
            Vacaciones
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: remotoColor }} />
            Remoto
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} style={{ backgroundColor: 'hsl(var(--info))' }} />
            Festivo
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendToday} />
            Hoy
          </span>
        </div>
        <div className={styles.yearNav}>
          <button type="button" onClick={() => setYear((y) => y - 1)} aria-label="Año anterior">
            <ChevronLeft />
          </button>
          <span>{year}</span>
          <button type="button" onClick={() => setYear((y) => y + 1)} aria-label="Año siguiente">
            <ChevronRight />
          </button>
        </div>
      </CardHeader>
      <CardContent className={styles.grid}>
        {MONTH_LABELS.map((label, monthIndex) => (
          <div key={label} className={styles.month}>
            <p className={styles.monthLabel}>{label}</p>
            <div className={styles.weekdays}>
              {WEEKDAY_LABELS.map((w) => (
                <span key={w} className={styles.weekday}>
                  {w}
                </span>
              ))}
            </div>
            <div className={styles.days}>
              {monthCells(year, monthIndex).map((date, index) => {
                if (!date) return <span key={`blank-${index}`} className={styles.day} />;

                const matchingRequest = requests.find((r) => isWithinRange(date, r));
                const type = matchingRequest ? typeById.get(matchingRequest.absenceTypeId) : undefined;
                const isHoliday = !matchingRequest && holidayDates.some((h) => isSameDay(h, date));
                const isToday = isSameDay(date, today);

                return (
                  <span
                    key={date.toISOString()}
                    className={styles.day}
                    data-today={isToday}
                    style={
                      matchingRequest
                        ? {
                            backgroundColor: type?.color ?? 'hsl(var(--secondary))',
                            opacity: matchingRequest.status === 'pending' ? 0.5 : 0.9,
                            color: '#fff',
                          }
                        : isHoliday
                          ? { backgroundColor: 'hsl(var(--info))', opacity: 0.85, color: '#fff' }
                          : undefined
                    }
                    title={
                      matchingRequest
                        ? `${type?.name ?? ''} (${matchingRequest.status})`
                        : isHoliday
                          ? 'Festivo'
                          : undefined
                    }
                  >
                    {date.getDate()}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
