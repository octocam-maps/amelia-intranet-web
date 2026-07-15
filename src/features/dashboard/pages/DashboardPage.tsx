import { useState } from 'react';
import { useStore } from '@/store';
import { LiveClockCard } from '@/features/time-clock/components/LiveClockCard';
import { AdminFiltersBar } from '../components/AdminFiltersBar';
import type { AdminHomeFiltersValue } from '../components/AdminFiltersBar';
import { AdminHomeTabs } from '../components/AdminHomeTabs';
import { AdminKpiRow } from '../components/AdminKpiRow';
import { AdminOnboardingSummaryCard } from '../components/AdminOnboardingSummaryCard';
import { AdminQuickLinksCard } from '../components/AdminQuickLinksCard';
import { AnnouncementsCard } from '../components/AnnouncementsCard';
import { AnonymousMailboxCard } from '../components/AnonymousMailboxCard';
import { AttendanceRadarCard } from '../components/AttendanceRadarCard';
import { RecentAbsenceRequestsCard } from '../components/RecentAbsenceRequestsCard';
import { UpcomingBirthdaysCard } from '../components/UpcomingBirthdaysCard';
import { UpcomingHolidaysCard } from '../components/UpcomingHolidaysCard';
import { VacationSummaryCard } from '../components/VacationSummaryCard';
import { useAdminMetrics } from '../application/useAdminMetrics';
import { useDashboardSummary } from '../application/useDashboardSummary';
import styles from './DashboardPage.module.css';

const TODAY_LABEL = new Date().toLocaleDateString('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

/**
 * Dashboard condicionado por rol (docs/permisos-roles.md § Inicio):
 * empleado ve sus propios widgets (deck 01-home-empleado); admin ve el Home
 * ampliado (filtros de Sede/Departamento, KPIs con sparklines, radar de
 * asistencia, pestañas operativas y columna de seguimiento). El backend
 * (`/dashboard/summary`, `/dashboard/admin/metrics`) decide qué llega y
 * quién puede pedirlo — aquí solo se condiciona qué RENDERIZAR.
 */
export function DashboardPage() {
  const user = useStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const isAdmin = user?.role === 'administrador';

  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();
  const [filters, setFilters] = useState<AdminHomeFiltersValue>({});
  const { data: metrics, isLoading: isMetricsLoading } = useAdminMetrics({
    entityId: filters.entityId,
    departmentId: filters.departmentId,
  });

  return (
    <div className={styles.root}>
      <div>
        <h1 className={styles.title}>Hola, {firstName}</h1>
        <p className={styles.subtitle}>
          {TODAY_LABEL.charAt(0).toUpperCase() + TODAY_LABEL.slice(1)} · Amelia Hub
        </p>
      </div>

      {isSummaryLoading || !summary ? (
        <p className={styles.loading}>Cargando…</p>
      ) : isAdmin ? (
        <>
          <AdminFiltersBar value={filters} onChange={setFilters} />

          <AdminKpiRow metrics={metrics} isLoading={isMetricsLoading} />

          <div className={styles.columns2}>
            <UpcomingBirthdaysCard title="Cumpleaños esta semana" />
            <VacationSummaryCard title="Tus vacaciones 2026" balance={summary.vacationBalance} />
          </div>

          <div className={styles.adminBottomGrid}>
            <AttendanceRadarCard items={metrics?.attendanceRadar ?? []} isLoading={isMetricsLoading} />

            <AdminHomeTabs
              pendingAbsenceRequests={summary.pendingAbsenceRequests ?? []}
              metricsKpis={metrics?.kpis}
              isMetricsLoading={isMetricsLoading}
            />

            <div className={styles.sideColumn}>
              <AdminQuickLinksCard />
              <AdminOnboardingSummaryCard />
              <AnonymousMailboxCard />
            </div>
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
