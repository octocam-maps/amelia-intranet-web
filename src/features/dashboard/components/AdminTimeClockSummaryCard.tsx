import { Link } from 'react-router-dom';
import type { AdminMetricsKpis } from '../domain/models';
import styles from './AdminTimeClockSummaryCard.module.css';

interface AdminTimeClockSummaryCardProps {
  kpis: AdminMetricsKpis | undefined;
  isLoading: boolean;
}

/** Resumen de "Control horario" de la pestaña central del Home admin — solo
 * los agregados que ya trae `GET /dashboard/admin/metrics` (no hay un
 * listado de "quién está fichado ahora" en este endpoint); el detalle
 * persona a persona vive en `/control-horario`. */
export function AdminTimeClockSummaryCard({ kpis, isLoading }: AdminTimeClockSummaryCardProps) {
  return (
    <div className={styles.root} aria-busy={isLoading}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <p className={styles.value}>{kpis?.clockedInNow ?? 0}</p>
          <p className={styles.label}>Personas fichadas ahora</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.value}>{kpis?.punctualityPct ?? 0}%</p>
          <p className={styles.label}>Puntualidad del periodo</p>
        </div>
      </div>
      <Link to="/control-horario" className={styles.link}>
        Ver registro completo de fichajes
      </Link>
    </div>
  );
}
