import { CalendarHeartIcon } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { SCOPE_BADGE_VARIANT, SCOPE_LABEL } from '@/features/holidays/domain/scope';
import type { UpcomingHoliday } from '../domain/models';
import styles from './UpcomingHolidaysCard.module.css';

/* El ámbito se PINTA, no se deduce. Aquí había un `SCOPE_CYCLE` que rotaba
   Nacional/Autonómico/Local por posición en la lista, justificado con que el
   backend "todavía no tiene columna de ámbito". Era falso: `holidays.scope`
   existe desde la migración 018 y `HolidaysTable` ya la pintaba bien — lo único
   que faltaba era que `GET /dashboard/summary` la proyectase, que ya lo hace.
   El resultado era que un festivo local se anunciaba como nacional según en qué
   posición cayera. Si vuelve a faltar el dato, se deja el hueco: ver la rama de
   `scope === null`. */

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
        <CalendarHeartIcon className={styles.icon} />
      </CardHeader>
      <CardContent>
        {holidays.length === 0 ? (
          <p className={styles.empty}>Todavía no hay festivos configurados (pendiente de Fase 5).</p>
        ) : (
          <ul className={styles.list}>
            {holidays.map((holiday) => {
              const { day, month } = formatDay(holiday.day);
              return (
                <li key={holiday.day} className={styles.row}>
                  <span className={styles.day}>
                    {month}
                    <span className={styles.dayNumber}>{day}</span>
                  </span>
                  <span className={styles.name}>{holiday.name}</span>
                  {holiday.scope ? (
                    <Badge variant={SCOPE_BADGE_VARIANT[holiday.scope]}>
                      {SCOPE_LABEL[holiday.scope]}
                    </Badge>
                  ) : (
                    // Sin ámbito no hay etiqueta. Es el caso de un festivo dado
                    // de alta a mano por el admin, y mismo tratamiento que en
                    // `HolidaysTable`.
                    <span className={styles.scopeEmpty} aria-hidden>
                      —
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
