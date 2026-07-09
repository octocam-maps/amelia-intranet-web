import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/store';
import { useDashboardSummary } from '../application/useDashboardSummary';
import styles from './DashboardPage.module.css';

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

/**
 * Dashboard condicionado por rol (docs/permisos-roles.md § Inicio):
 * empleado ve sus propios widgets; admin ve además la bandeja de
 * aprobación y la vista global. El backend (`/dashboard/summary`) decide
 * qué llega — aquí solo se pinta lo que la respuesta trae.
 */
export function DashboardPage() {
  const user = useStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const { data: summary, isLoading } = useDashboardSummary();

  return (
    <div className={styles.root}>
      <div>
        <h1 className={styles.title}>Hola, {firstName}</h1>
        <p className={styles.subtitle}>Esto es lo que tienes pendiente hoy.</p>
      </div>

      {isLoading || !summary ? (
        <p className={styles.loading}>Cargando…</p>
      ) : (
        <div className={styles.grid}>
          <Card>
            <CardHeader>
              <CardTitle>Vacaciones</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.vacationBalance ? (
                <>
                  <p className={styles.metric}>
                    {summary.vacationBalance.availableDays} días disponibles
                  </p>
                  <p className={styles.detail}>
                    {summary.vacationBalance.entitledDays} asignados ·{' '}
                    {summary.vacationBalance.usedDays} usados ·{' '}
                    {summary.vacationBalance.pendingDays} pendientes
                  </p>
                </>
              ) : (
                <p className={styles.detail}>Todavía no tienes saldo de vacaciones registrado.</p>
              )}
              <Link to="/ausencias" className={styles.link}>
                Ir a Ausencias →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fichaje de hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={styles.metric}>
                {formatMinutes(summary.todayClockStatus.workedMinutesToday)}
              </p>
              <p className={styles.detail}>
                {summary.todayClockStatus.hasOpenEntry
                  ? 'Tienes un tramo abierto.'
                  : 'Sin tramos abiertos ahora mismo.'}
              </p>
              <Link to="/control-horario" className={styles.link}>
                Ir a Control horario →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos festivos</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.upcomingHolidays.length === 0 ? (
                <p className={styles.detail}>
                  Todavía no hay festivos configurados (pendiente de Fase 5).
                </p>
              ) : (
                <ul className={styles.holidayList}>
                  {summary.upcomingHolidays.map((holiday) => (
                    <li key={holiday.day}>
                      {holiday.day} — {holiday.name}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {summary.pendingAbsenceRequests !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Bandeja de aprobación</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={styles.metric}>
                  {summary.pendingAbsenceRequests.length} solicitudes pendientes
                </p>
                <p className={styles.detail}>
                  {summary.employeesClockedInNow} empleados con un tramo abierto ahora
                </p>
                <Link to="/ausencias" className={styles.link}>
                  Revisar bandeja →
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
