import { useStore } from '@/store';
import { LiveClockCard } from '@/features/time-clock/components/LiveClockCard';
import { AdminApprovalQueueCard } from '../components/AdminApprovalQueueCard';
import { AdminStatCards } from '../components/AdminStatCards';
import { AnnouncementsCard } from '../components/AnnouncementsCard';
import { AnonymousMailboxCard } from '../components/AnonymousMailboxCard';
import { RecentAbsenceRequestsCard } from '../components/RecentAbsenceRequestsCard';
import { UpcomingBirthdaysCard } from '../components/UpcomingBirthdaysCard';
import { UpcomingHolidaysCard } from '../components/UpcomingHolidaysCard';
import { VacationSummaryCard } from '../components/VacationSummaryCard';
import { useDashboardSummary } from '../application/useDashboardSummary';
import styles from './DashboardPage.module.css';

const TODAY_LABEL = new Date().toLocaleDateString('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/**
 * Dashboard condicionado por rol (docs/permisos-roles.md § Inicio):
 * empleado ve sus propios widgets (deck 01-home-empleado); admin ve además
 * la bandeja de aprobación y la vista global (deck 02-home-admin-bandeja).
 * El backend (`/dashboard/summary`) decide qué llega — aquí solo se
 * condiciona qué RENDERIZAR con lo que la respuesta trae.
 */
export function DashboardPage() {
  const user = useStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const { data: summary, isLoading } = useDashboardSummary();
  const isAdmin = Boolean(summary?.pendingAbsenceRequests);

  return (
    <div className={styles.root}>
      <div>
        <h1 className={styles.title}>Hola, {firstName}</h1>
        <p className={styles.subtitle}>
          {TODAY_LABEL.charAt(0).toUpperCase() + TODAY_LABEL.slice(1)} · Amelia Hub
        </p>
      </div>

      {isLoading || !summary ? (
        <p className={styles.loading}>Cargando…</p>
      ) : isAdmin ? (
        <>
          <AdminStatCards pendingRequestsCount={summary.pendingAbsenceRequests?.length ?? 0} />
          <AdminApprovalQueueCard requests={summary.pendingAbsenceRequests ?? []} />
          <div className={styles.columns2}>
            <VacationSummaryCard title="Tus vacaciones 2026" balance={summary.vacationBalance} />
            <UpcomingBirthdaysCard title="Cumpleaños esta semana" />
          </div>
        </>
      ) : (
        <>
          <LiveClockCard />

          <div className={styles.columns3}>
            <VacationSummaryCard title="Vacaciones 2026" balance={summary.vacationBalance} />
            <UpcomingHolidaysCard holidays={summary.upcomingHolidays} />
            <UpcomingBirthdaysCard />
          </div>

          <div className={styles.columns2}>
            <RecentAbsenceRequestsCard />
            <div className={styles.sideColumn}>
              <AnnouncementsCard />
              <AnonymousMailboxCard />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
