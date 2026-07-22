import { useState } from 'react';
import { isAdmin, isExternalGuest } from '@/features/auth/domain/models';
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
 * ampliado (filtros de Sede/Departamento, KPIs, pestañas operativas y
 * columna de seguimiento — sin gráficos, solo tarjetas de información). El
 * backend (`/dashboard/summary`, `/dashboard/admin/metrics`) decide qué
 * llega y quién puede pedirlo — aquí solo se condiciona qué RENDERIZAR.
 *
 * `externo_invitado` NO entra en ninguna de las dos ramas anteriores: su
 * Inicio es un mini-dashboard recortado a 2 tarjetas de solo lectura
 * (Anuncios + Cumpleaños) — nada de fichaje, ausencias, nóminas ni
 * quick-links. `useDashboardSummary`/`useAdminMetrics` se llaman igual
 * (reglas de hooks: mismo orden en cada render), pero con `enabled: false`
 * para este rol, porque el backend rechaza a `externo_invitado` en
 * `GET /dashboard/summary` con 403
 * (`require_role("administrador", "empleado", "socio")` —
 * ver `dashboard/infrastructure/routes.py` y su test de rutas); pedirlo solo
 * para descartarlo sería un 403 innecesario. `AnnouncementsCard` y
 * `UpcomingBirthdaysCard` sí aceptan este rol (`announcements` incluye
 * `externo_invitado` en su `require_role`; `team/birthdays` no restringe
 * por rol) y se reutilizan tal cual, sin duplicarlas.
 */
export function DashboardPage() {
  const user = useStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const admin = isAdmin(user?.role);
  const externalGuest = isExternalGuest(user?.role);

  // Los 3 hooks se llaman siempre, en el mismo orden, para respetar las
  // reglas de hooks — `enabled` es lo que evita la petición de red que el
  // backend rechazaría (ver comentario de clase). `useState` de filtros solo
  // lo usa la rama admin, pero debe declararse aquí por el mismo motivo.
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary({
    enabled: !externalGuest,
  });
  const [filters, setFilters] = useState<AdminHomeFiltersValue>({});
  const { data: metrics, isLoading: isMetricsLoading } = useAdminMetrics(
    { entityId: filters.entityId, departmentIds: filters.departmentIds },
    { enabled: admin },
  );

  if (externalGuest) {
    return (
      <div className={styles.root}>
        <div>
          <h1 className={styles.title}>Hola, {firstName}</h1>
          <p className={styles.subtitle}>
            {TODAY_LABEL.charAt(0).toUpperCase() + TODAY_LABEL.slice(1)} · Amelia Hub
          </p>
        </div>

        <div className={styles.externalGuestGrid}>
          <AnnouncementsCard />
          <UpcomingBirthdaysCard />
        </div>
      </div>
    );
  }

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
      ) : admin ? (
        <>
          <AdminFiltersBar value={filters} onChange={setFilters} />

          <AdminKpiRow metrics={metrics} isLoading={isMetricsLoading} />

          <div className={styles.adminMainGrid}>
            <AdminHomeTabs
              pendingAbsenceRequests={summary.pendingAbsenceRequests ?? []}
              metricsKpis={metrics?.kpis}
              isMetricsLoading={isMetricsLoading}
            />

            <div className={styles.sideColumn}>
              <UpcomingBirthdaysCard title="Cumpleaños esta semana" />
              <VacationSummaryCard title="Tus vacaciones 2026" balance={summary.vacationBalance} />
              <AdminQuickLinksCard />
              <AdminOnboardingSummaryCard />
            </div>
          </div>
        </>
      ) : (
        <>
          <LiveClockCard />

          <AnnouncementsCard />

          <div className={styles.columns3}>
            <VacationSummaryCard title="Vacaciones 2026" balance={summary.vacationBalance} />
            <UpcomingHolidaysCard holidays={summary.upcomingHolidays} />
            <UpcomingBirthdaysCard />
          </div>

          <div className={styles.columns2}>
            <RecentAbsenceRequestsCard />
            <div className={styles.sideColumn}>
              <AnonymousMailboxCard />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
