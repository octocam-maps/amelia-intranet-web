import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/store';
import type { AbsenceKind, TeamAbsenceEntry } from '../domain/models';
import { useTeamCalendar } from '../application/useTeamCalendar';
import styles from './TeamCalendar.module.css';

const LEGEND: { kind: AbsenceKind; label: string }[] = [
  { kind: 'vacaciones', label: 'De vacaciones' },
  { kind: 'remoto', label: 'En remoto' },
  { kind: 'ausente', label: 'Ausente / No disponible' },
];

function toDateOnly(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function monthParam(cursor: Date): string {
  return `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * deck-fase5/07-equipo-calendario.png — gantt de solo lectura, sin bandeja
 * de aprobación. Alcance FIJO al departamento del usuario autenticado: el
 * backend ya filtra las ausencias por `department_id` del solicitante (no
 * hay ni habrá selector de "ver otro equipo" — decisión de producto, no
 * limitación técnica), así que las filas se construyen directamente a
 * partir de las ausencias devueltas, nunca de un directorio de toda la
 * plantilla.
 *
 * Cada ausencia trae un `kind` privacy-safe (`vacaciones`/`remoto`/
 * `ausente`) — nunca el motivo real. `ausente` agrupa baja médica, asuntos
 * propios, duelo, etc. sin distinguirlos entre sí.
 */
export function TeamCalendar() {
  const currentUserId = useStore((s) => s.user?.id);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const month = monthParam(cursor);
  const { data: entries = [], isLoading } = useTeamCalendar(month);

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex, daysInMonth);

  const rows = useMemo(() => {
    const byUser = new Map<string, { name: string; entries: TeamAbsenceEntry[] }>();
    for (const entry of entries) {
      const row = byUser.get(entry.userId) ?? { name: entry.fullName, entries: [] };
      row.entries.push(entry);
      byUser.set(entry.userId, row);
    }
    return Array.from(byUser.entries())
      .map(([userId, row]) => ({
        userId,
        name: row.name,
        isCurrentUser: userId === currentUserId,
        entries: row.entries,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [entries, currentUserId]);

  const gridStyle = { gridTemplateColumns: `repeat(${daysInMonth}, minmax(1.5rem, 1fr))` };
  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <CardTitle>Calendario de mi departamento</CardTitle>
          <Badge variant="outline" className={styles.readOnlyBadge}>
            <ShieldCheck />
            Solo lectura
          </Badge>
        </div>
        <div className={styles.monthNav}>
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            aria-label="Mes anterior"
          >
            <ChevronLeft />
          </button>
          <span>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</span>
          <button
            type="button"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            aria-label="Mes siguiente"
          >
            <ChevronRight />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <p className={styles.description}>
          Solo ves a las personas de tu departamento y únicamente el estado de su ausencia, nunca
          el motivo.
        </p>

        <div className={styles.scrollArea}>
          <div className={styles.headerDays} style={gridStyle}>
            {days.map((day) => (
              <span
                key={day}
                className={styles.dayHeader}
                data-weekend={isWeekend(new Date(year, monthIndex, day))}
              >
                {day}
              </span>
            ))}
          </div>

          {isLoading ? (
            <p className={styles.empty}>Cargando calendario…</p>
          ) : rows.length === 0 ? (
            <p className={styles.empty}>
              Nadie de tu departamento tiene una ausencia aprobada este mes.
            </p>
          ) : (
            rows.map((row) => (
              <div key={row.userId} className={styles.employeeRow}>
                <div className={styles.employeeLabel}>
                  <Avatar className={styles.avatar}>
                    <AvatarFallback>{initialsOf(row.name)}</AvatarFallback>
                  </Avatar>
                  <span className={styles.name}>
                    {row.name}
                    {row.isCurrentUser && ' · tú'}
                  </span>
                </div>
                <div className={styles.track} style={gridStyle}>
                  {days.map((day) => (
                    <span
                      key={day}
                      className={styles.dayCell}
                      data-weekend={isWeekend(new Date(year, monthIndex, day))}
                    />
                  ))}
                  {row.entries.map((entry, index) => {
                    const start = toDateOnly(entry.startDate);
                    const end = toDateOnly(entry.endDate);
                    if (end < monthStart || start > monthEnd) return null;
                    const startDay = start < monthStart ? 1 : start.getDate();
                    const endDay = end > monthEnd ? daysInMonth : end.getDate();
                    return (
                      <span
                        key={index}
                        className={styles.bar}
                        data-kind={entry.kind}
                        style={{ gridColumn: `${startDay} / ${endDay + 1}` }}
                        title={LEGEND.find((l) => l.kind === entry.kind)?.label}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.legend}>
          {LEGEND.map(({ kind, label }) => (
            <span key={kind} className={styles.legendItem}>
              <span className={styles.legendDot} data-kind={kind} />
              {label}
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
