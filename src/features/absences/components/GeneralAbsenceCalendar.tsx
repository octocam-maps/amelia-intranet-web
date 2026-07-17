import { useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { AbsenceCalendarEntry } from '../domain/models';
import styles from './GeneralAbsenceCalendar.module.css';

function toDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay(); // 0 = domingo, 6 = sábado
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

interface GeneralAbsenceCalendarProps {
  entries: AbsenceCalendarEntry[];
  isLoading: boolean;
  cursor: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

/**
 * "Calendario general de la plantilla" (LOTE 4) — vista de RRHH del
 * administrador y del rol `socio` [migración 024] (RBAC real vía
 * `require_role` en el backend). Gantt de solo lectura con TODOS los
 * empleados, no solo el propio departamento (a diferencia de `TeamCalendar`,
 * que el resto de roles usa con alcance limitado) ni solo el histórico sin
 * acotar de `TeamAbsenceGantt` (que sigue viviendo dentro de Ausencias >
 * gestión) — esta pantalla pide `/absences/calendar/all` por el mes
 * visible, con el `absenceTypeName`/`absenceTypeColor` ya resueltos por el
 * backend.
 *
 * Los fines de semana usan el mismo fondo navy translúcido que
 * `AbsenceMonthCalendar` (LOTE 5b) para que el patrón visual sea coherente
 * entre el calendario personal y este.
 */
export function GeneralAbsenceCalendar({
  entries,
  isLoading,
  cursor,
  onPreviousMonth,
  onNextMonth,
}: GeneralAbsenceCalendarProps) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);

  const rows = useMemo(() => {
    const byUser = new Map<string, { name: string; entries: AbsenceCalendarEntry[] }>();
    for (const entry of entries) {
      const row = byUser.get(entry.userId) ?? { name: entry.userFullName, entries: [] };
      row.entries.push(entry);
      byUser.set(entry.userId, row);
    }
    return Array.from(byUser.entries())
      .map(([userId, row]) => ({ userId, name: row.name, entries: row.entries }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [entries]);

  const legend = useMemo(() => {
    const byType = new Map<string, { name: string; color: string | null }>();
    for (const entry of entries) {
      if (!byType.has(entry.absenceTypeId)) {
        byType.set(entry.absenceTypeId, {
          name: entry.absenceTypeName,
          color: entry.absenceTypeColor,
        });
      }
    }
    return Array.from(byType.values());
  }, [entries]);

  const gridStyle = { gridTemplateColumns: `repeat(${daysInMonth}, minmax(1.5rem, 1fr))` };
  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Calendario</CardTitle>
        <div className={styles.monthNav}>
          <button type="button" onClick={onPreviousMonth} aria-label="Mes anterior">
            <ChevronLeftIcon />
          </button>
          <span>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</span>
          <button type="button" onClick={onNextMonth} aria-label="Mes siguiente">
            <ChevronRightIcon />
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
                data-weekend={isWeekend(new Date(year, month, day)) || undefined}
              >
                {day}
              </span>
            ))}
          </div>

          {isLoading ? (
            <p className={styles.empty}>Cargando calendario…</p>
          ) : rows.length === 0 ? (
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
                      data-weekend={isWeekend(new Date(year, month, day)) || undefined}
                    />
                  ))}
                  {row.entries.map((entry) => {
                    const start = toDateOnly(entry.startDate);
                    const end = toDateOnly(entry.endDate);
                    if (end < monthStart || start > monthEnd) return null;
                    const startDay = start < monthStart ? 1 : start.getDate();
                    const endDay = end > monthEnd ? daysInMonth : end.getDate();
                    return (
                      <span
                        key={entry.requestId}
                        className={styles.bar}
                        style={{
                          gridColumn: `${startDay} / ${endDay + 1}`,
                          backgroundColor: entry.absenceTypeColor ?? 'hsl(var(--secondary))',
                          opacity: entry.status === 'pending' ? 0.55 : 1,
                        }}
                        title={`${entry.absenceTypeName} · ${entry.userFullName} (${
                          entry.status === 'pending' ? 'pendiente' : 'aprobada'
                        })`}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.legend}>
          {legend.map((type) => (
            <span key={type.name} className={styles.legendItem}>
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
