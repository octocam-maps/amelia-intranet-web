import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/store';
import type { TeamMember, TeamVacationEntry } from '../domain/models';
import { useTeamVacationCalendar } from '../application/useTeamVacationCalendar';
import styles from './TeamVacationCalendar.module.css';

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

interface TeamVacationCalendarProps {
  members: TeamMember[];
}

/**
 * deck-fase5/07-equipo-calendario.png — gantt de solo lectura, sin
 * bandeja de aprobación: solo pinta vacaciones ya aprobadas. Las filas son
 * TODO el equipo (no solo quien tiene vacaciones este mes), para que cada
 * persona vea también su propia fila sin marcar.
 */
export function TeamVacationCalendar({ members }: TeamVacationCalendarProps) {
  const currentUserId = useStore((s) => s.user?.id);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const month = monthParam(cursor);
  const { data: entries = [], isLoading } = useTeamVacationCalendar(month);

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex, daysInMonth);

  const rows = useMemo(() => {
    const byUser = new Map<string, TeamVacationEntry[]>();
    for (const entry of entries) {
      const list = byUser.get(entry.userId) ?? [];
      list.push(entry);
      byUser.set(entry.userId, list);
    }
    return members
      .map((member) => ({
        userId: member.id,
        name: member.fullName,
        isCurrentUser: member.id === currentUserId,
        entries: byUser.get(member.id) ?? [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, entries, currentUserId]);

  const gridStyle = { gridTemplateColumns: `repeat(${daysInMonth}, minmax(1.5rem, 1fr))` };
  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <CardTitle>Vacaciones del equipo</CardTitle>
          <Badge variant="outline" className={styles.readOnlyBadge}>
            <Eye />
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
          Solo se muestran vacaciones aprobadas. Otros tipos de ausencia no aparecen aquí.
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
            <p className={styles.empty}>No hay personas en el equipo todavía.</p>
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
                        style={{ gridColumn: `${startDay} / ${endDay + 1}` }}
                        title={`${entry.startDate} → ${entry.endDate}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendDot} />
            Vacaciones aprobadas
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendWeekend} />
            Fin de semana
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
