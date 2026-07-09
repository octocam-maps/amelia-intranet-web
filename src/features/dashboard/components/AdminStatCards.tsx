import { ClipboardList, UserX, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import styles from './AdminStatCards.module.css';

interface AdminStatCardsProps {
  pendingRequestsCount: number;
}

/**
 * 3 stat-cards del deck 02-home-admin-bandeja. "Plantilla activa" y
 * "Ausentes hoy" dependen del módulo Equipo (Fase 5, sin endpoint
 * todavía) — quedan como placeholder explícito con el mismo criterio que
 * el resto de widgets fuera de fase; "Solicitudes por aprobar" SÍ es dato
 * real (`dashboard/summary.pendingAbsenceRequests`).
 */
export function AdminStatCards({ pendingRequestsCount }: AdminStatCardsProps) {
  return (
    <div className={styles.grid}>
      <Card>
        <CardContent className={styles.card}>
          <div className={cn(styles.icon, styles.iconNeutral)}>
            <Users />
          </div>
          <div>
            <p className={styles.value} title="Módulo Equipo pendiente de Fase 5">
              —
            </p>
            <p className={styles.label}>Plantilla activa</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className={styles.card}>
          <div className={cn(styles.icon, styles.iconWarning)}>
            <UserX />
          </div>
          <div>
            <p className={styles.value} title="Módulo Equipo pendiente de Fase 5">
              —
            </p>
            <p className={styles.label}>Ausentes hoy</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className={styles.card}>
          <div className={cn(styles.icon, styles.iconSuccess)}>
            <ClipboardList />
          </div>
          <div>
            <p className={styles.value}>{pendingRequestsCount}</p>
            <p className={styles.label}>Solicitudes por aprobar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
