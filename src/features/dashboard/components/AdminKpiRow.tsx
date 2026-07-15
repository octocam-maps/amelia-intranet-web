import { CalendarX2, ClipboardList, Target, Users } from 'lucide-react';
import type { AdminDashboardMetrics } from '../domain/models';
import { AdminKpiCard } from './AdminKpiCard';
import styles from './AdminKpiRow.module.css';

interface AdminKpiRowProps {
  metrics: AdminDashboardMetrics | undefined;
  isLoading: boolean;
}

/**
 * Fila de 4 KPIs del Home admin (`GET /dashboard/admin/metrics`). Los
 * valores son siempre numéricos (`0` si no hay dato, nunca `'—'` — regla
 * explícita del brief); mientras carga se muestran las mismas 4 tarjetas en
 * `0` en vez de un esqueleto, para no saltar el layout.
 */
export function AdminKpiRow({ metrics, isLoading }: AdminKpiRowProps) {
  const kpis = metrics?.kpis;
  const trends = metrics?.trends;

  return (
    <div className={styles.grid} aria-busy={isLoading}>
      <AdminKpiCard
        label="Ausencias hoy"
        value={String(kpis?.absentToday ?? 0)}
        icon={CalendarX2}
        tone="warning"
        series={trends?.absences}
        sparklineTone="neutral"
      />
      <AdminKpiCard
        label="Fichados ahora"
        value={String(kpis?.clockedInNow ?? 0)}
        icon={Users}
        tone="success"
        series={trends?.clockedIn}
      />
      <AdminKpiCard
        label="Pendientes de aprobar"
        value={String(kpis?.pendingApprovals ?? 0)}
        icon={ClipboardList}
        tone="neutral"
        // El backend no calcula una serie diaria para este KPI — sin
        // sparkline en vez de inventar una tendencia (ver domain/models.ts).
        series={undefined}
      />
      <AdminKpiCard
        label="Puntualidad global"
        value={`${kpis?.punctualityPct ?? 0}%`}
        icon={Target}
        tone="success"
        series={trends?.punctuality}
      />
    </div>
  );
}
