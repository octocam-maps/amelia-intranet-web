import { CalendarHeart } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { BadgeProps } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { UpcomingHoliday } from '../domain/models';
import styles from './UpcomingHolidaysCard.module.css';

// El backend (`holidays`, docs/fase-0-esquema-datos.md) todavía no tiene una
// columna de ámbito (Nacional/Autonómico/Local) — es Fase 5. El ciclo aquí
// es SOLO presentación (deck 01-home-empleado) para que el layout no se vea
// vacío; en cuanto el backend exponga `scope`, esto se sustituye por el
// dato real y deja de rotar.
const SCOPE_CYCLE: Array<{ label: string; variant: BadgeProps['variant'] }> = [
  { label: 'Nacional', variant: 'outline' },
  { label: 'Autonómico', variant: 'success' },
  { label: 'Local', variant: 'warning' },
];

function formatDay(iso: string): { day: string; month: string } {
  const date = new Date(`${iso}T00:00:00`);
  return {
    day: String(date.getDate()),
    month: date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
  };
}

export function UpcomingHolidaysCard({ holidays }: { holidays: UpcomingHoliday[] }) {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Próximos festivos</CardTitle>
        <CalendarHeart className={styles.icon} />
      </CardHeader>
      <CardContent>
        {holidays.length === 0 ? (
          <p className={styles.empty}>Todavía no hay festivos configurados (pendiente de Fase 5).</p>
        ) : (
          <ul className={styles.list}>
            {holidays.map((holiday, index) => {
              const { day, month } = formatDay(holiday.day);
              // `SCOPE_CYCLE` no está vacío — el índice siempre cae dentro del array.
              const scope = SCOPE_CYCLE[index % SCOPE_CYCLE.length]!;
              return (
                <li key={holiday.day} className={styles.row}>
                  <span className={styles.day}>
                    {month}
                    <span className={styles.dayNumber}>{day}</span>
                  </span>
                  <span className={styles.name}>{holiday.name}</span>
                  <Badge variant={scope.variant}>{scope.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
