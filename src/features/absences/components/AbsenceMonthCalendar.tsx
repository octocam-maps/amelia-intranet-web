import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { UpcomingHoliday } from '@/features/dashboard/domain/models';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import styles from './AbsenceMonthCalendar.module.css';

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

interface AbsenceMonthCalendarProps {
  requests: AbsenceRequest[];
  types: AbsenceType[];
  holidays: UpcomingHoliday[];
}

/**
 * Calendario MES A MES — a pedido explícito del usuario, sustituye la
 * versión anual (12 mini-meses) para que las celdas del mes visible ocupen
 * bien el espacio de la columna derecha en vez de quedar minúsculas.
 * Navegación con ‹ Mes Año ›. Grid nativo, sin librería de calendario. Los
 * festivos solo cubren los "próximos" que trae `dashboard/summary` (Fase 5
 * no tiene todavía un endpoint de festivos del año completo).
 */
export function AbsenceMonthCalendar({ requests, types, holidays }: AbsenceMonthCalendarProps) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const goToPreviousMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);
  const holidayDates = useMemo(() => holidays.map((h) => toDateOnly(h.day)), [holidays]);
  const cells = useMemo(() => monthCells(year, month), [year, month]);
  const rows = Math.ceil(cells.length / 7);
  const vacacionesColor = types.find((t) => t.code === 'vacaciones')?.color ?? 'hsl(var(--warning))';
  const remotoColor = types.find((t) => t.code === 'remoto')?.color ?? 'hsl(var(--info))';

  return (
    <Card className={styles.cardFill}>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Calendario</CardTitle>
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
        <div className={styles.monthNav}>
          <button type="button" onClick={goToPreviousMonth} aria-label="Mes anterior">
            <ChevronLeft />
          </button>
          <span>{MONTH_LABELS[month]} {year}</span>
          <button type="button" onClick={goToNextMonth} aria-label="Mes siguiente">
            <ChevronRight />
          </button>
        </div>
      </CardHeader>
      <CardContent className={styles.calendar}>
        <div className={styles.weekdays}>
          {WEEKDAY_LABELS.map((w) => (
            <span key={w} className={styles.weekday}>
              {w}
            </span>
          ))}
        </div>
        <div className={styles.days} style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
          {cells.map((date, index) => {
            if (!date) return <span key={`blank-${index}`} className={styles.dayCell} />;

            const matchingRequest = requests.find((r) => isWithinRange(date, r));
            const type = matchingRequest ? typeById.get(matchingRequest.absenceTypeId) : undefined;
            const isHoliday = !matchingRequest && holidayDates.some((h) => isSameDay(h, date));
            const isToday = isSameDay(date, today);

            return (
              <span key={date.toISOString()} className={styles.dayCell}>
                <span
                  className={styles.dayContent}
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
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
