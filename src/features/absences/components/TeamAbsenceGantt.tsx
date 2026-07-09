import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import styles from './TeamAbsenceGantt.module.css';

function toDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

interface TeamAbsenceGanttProps {
  requests: AbsenceRequest[];
  types: AbsenceType[];
}

/**
 * "Calendario de la plantilla" del deck 05-ausencias-admin — gantt simple
 * con CSS grid nativo (cada día es una columna; las barras se posicionan
 * con `grid-column`, sin absolute positioning ni librería nueva).
 */
export function TeamAbsenceGantt({ requests, types }: TeamAbsenceGanttProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const typeById = useMemo(() => new Map(types.map((t) => [t.id, t])), [types]);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);

  const rows = useMemo(() => {
    // `monthStart`/`monthEnd` locales (no los de fuera) para que el memo
    // dependa de primitivos (`year`, `month`) y no de un `Date` recreado en
    // cada render.
    const start = new Date(year, month, 1);
    const end = new Date(year, month, daysInMonth);
    const byUser = new Map<string, AbsenceRequest[]>();
    for (const request of requests) {
      const requestStart = toDateOnly(request.startDate);
      const requestEnd = toDateOnly(request.endDate);
      if (requestEnd < start || requestStart > end) continue; // fuera del mes visible
      const list = byUser.get(request.userId) ?? [];
      list.push(request);
      byUser.set(request.userId, list);
    }
    return Array.from(byUser.entries())
      .map(([userId, userRequests]) => ({
        userId,
        // `user_full_name` viene del backend (JOIN con `users`) en TODAS las
        // solicitudes de `/absences/requests/all` — el fallback solo cubre
        // el caso (no esperado) de que viniera vacío de verdad.
        name: userRequests[0]?.userFullName || `Empleado #${userId.slice(-4).toUpperCase()}`,
        requests: userRequests,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests, year, month, daysInMonth]);

  const gridStyle = { gridTemplateColumns: `repeat(${daysInMonth}, minmax(1.5rem, 1fr))` };
  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Calendario de la plantilla</CardTitle>
        <div className={styles.monthNav}>
          <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} aria-label="Mes anterior">
            <ChevronLeft />
          </button>
          <span>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</span>
          <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} aria-label="Mes siguiente">
            <ChevronRight />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={styles.scrollArea}>
          <div className={styles.headerDays} style={gridStyle}>
            {days.map((day) => (
              <span
                key={day}
                className={styles.dayHeader}
                data-weekend={isWeekend(new Date(year, month, day))}
              >
                {day}
              </span>
            ))}
          </div>

          {rows.length === 0 ? (
            <p className={styles.empty}>Sin ausencias registradas este mes.</p>
          ) : (
            rows.map((row) => (
              <div key={row.userId} className={styles.employeeRow}>
                <div className={styles.employeeLabel}>
                  <Avatar className={styles.avatar}>
                    <AvatarFallback>{initialsOf(row.name)}</AvatarFallback>
                  </Avatar>
                  <span className={styles.name}>{row.name}</span>
                </div>
                <div className={styles.track} style={gridStyle}>
                  {days.map((day) => (
                    <span
                      key={day}
                      className={styles.dayCell}
                      data-weekend={isWeekend(new Date(year, month, day))}
                    />
                  ))}
                  {row.requests.map((request) => {
                    const start = toDateOnly(request.startDate);
                    const end = toDateOnly(request.endDate);
                    const startDay = start < monthStart ? 1 : start.getDate();
                    const endDay = end > monthEnd ? daysInMonth : end.getDate();
                    const type = typeById.get(request.absenceTypeId);
                    return (
                      <span
                        key={request.id}
                        className={styles.bar}
                        style={{
                          gridColumn: `${startDay} / ${endDay + 1}`,
                          backgroundColor: type?.color ?? 'hsl(var(--secondary))',
                          opacity: request.status === 'pending' ? 0.55 : 1,
                        }}
                        title={`${type?.name ?? ''} · ${request.startDate} → ${request.endDate}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.legend}>
          {types.map((type) => (
            <span key={type.id} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: type.color ?? undefined }} />
              {type.name}
            </span>
          ))}
          <span className={styles.legendItem}>
            <span className={styles.legendWeekend} />
            Fin de semana
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
