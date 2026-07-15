import { Cake } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTeamBirthdays } from '@/features/team/application/useTeamBirthdays';
import styles from './UpcomingBirthdaysCard.module.css';

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

// `day`/`month` no traen año (docs/permisos-roles.md RGPD) — se formatean
// sobre un año cualquiera solo para obtener el nombre del mes en es-ES.
function formatBirthday(day: number, month: number): string {
  const date = new Date(2001, month - 1, day);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

/** "Cumpleaños esta semana" del Inicio (deck 01/02-home) — conectada a
 * `/team/birthdays` (feature `team`). Sin datos inventados: si el hook
 * falla o la ventana está vacía, se muestra un estado honesto en vez de
 * un placeholder estático. */
export function UpcomingBirthdaysCard({ title = 'Próximos cumpleaños' }: { title?: string }) {
  const { data: birthdays = [], isLoading, isError } = useTeamBirthdays();

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>{title}</CardTitle>
        <Cake className={styles.icon} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : isError ? (
          <p className={styles.empty}>No se han podido cargar los cumpleaños.</p>
        ) : birthdays.length === 0 ? (
          <p className={styles.empty}>No hay cumpleaños esta semana.</p>
        ) : (
          <ul className={styles.list}>
            {birthdays.map((birthday) => (
              <li key={birthday.userId} className={styles.row}>
                <Avatar className={styles.avatar}>
                  {birthday.avatarUrl && (
                    <AvatarImage src={birthday.avatarUrl} alt={birthday.fullName} />
                  )}
                  <AvatarFallback>{initialsOf(birthday.fullName)}</AvatarFallback>
                </Avatar>
                <span className={styles.name}>{birthday.fullName}</span>
                <span className={birthday.isToday ? styles.dateToday : styles.date}>
                  {birthday.isToday ? 'Hoy 🎂' : formatBirthday(birthday.day, birthday.month)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
