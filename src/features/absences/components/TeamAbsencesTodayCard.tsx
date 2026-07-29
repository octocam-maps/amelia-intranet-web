import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useTeamCalendar } from '@/features/team/application/useTeamCalendar';
import { toDateOnly } from '../domain/dateOnly';
import { selectTeamAbsencesToday, teamAbsenceKindLabel } from '../domain/teamAbsencesToday';
import styles from './TeamAbsencesTodayCard.module.css';

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * "Ausencias del equipo (hoy)" — columna derecha. Responde a "¿con quién no
 * puedo contar hoy?" sin salir de la pantalla de ausencias.
 *
 * PRIVACIDAD: se muestra TAL CUAL el `kind` que devuelve el backend
 * (`vacaciones` | `remoto` | `ausente`), que ya agrupa bajo `ausente` todo lo
 * sensible — baja médica, duelo, etc. Nunca se deduce ni se muestra el tipo
 * real de ausencia, y NO se cruzan estos datos con `/absences` para
 * "enriquecerlos" (ver `domain/teamAbsencesToday.ts`).
 *
 * El alcance es el DEPARTAMENTO del usuario, no toda la plantilla: lo resuelve
 * el backend por el token. El subtítulo lo dice explícitamente para que nadie
 * lea una lista corta como "hoy casi no falta nadie en la empresa".
 */
export function TeamAbsencesTodayCard() {
  const month = new Date().toISOString().slice(0, 7);
  const { data, isLoading, isError } = useTeamCalendar(month);

  const today = toDateOnly(new Date().toISOString().slice(0, 10));
  // `listTeamCalendar` ya devuelve el array de entradas mapeado, no un
  // envoltorio `{ entries }` como el DTO del backend.
  const absentToday = selectTeamAbsencesToday(data ?? [], today);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ausencias del equipo (hoy)</CardTitle>
        <p className={styles.scope}>Compañeros de tu departamento</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className={styles.muted}>Cargando…</p>
        ) : isError ? (
          <p className={styles.muted}>No se pudo cargar el equipo.</p>
        ) : absentToday.length === 0 ? (
          <p className={styles.muted}>Hoy no falta nadie de tu departamento.</p>
        ) : (
          <ul className={styles.list}>
            {absentToday.map((entry) => (
              <li key={entry.userId} className={styles.row}>
                {/* Solo iniciales: `TeamAbsenceEntry` no expone `avatarUrl`
                    (el endpoint del calendario de equipo no lo devuelve), así
                    que mostrar la foto exigiría ampliar el contrato del
                    backend. Mismo patrón que `TeamCalendar`. */}
                <Avatar className={styles.avatar}>
                  <AvatarFallback>{initials(entry.fullName)}</AvatarFallback>
                </Avatar>
                <span className={styles.info}>
                  <span className={styles.name}>{entry.fullName}</span>
                  <span className={styles.kind}>{teamAbsenceKindLabel(entry.kind)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
