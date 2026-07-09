import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { AbsenceApprovalList } from '@/features/absences/components/AbsenceApprovalList';
import type { PendingAbsenceRequestSummary } from '../domain/models';
import styles from './AdminApprovalQueueCard.module.css';

/** "Solicitudes de ausencia por aprobar" del deck 02-home-admin-bandeja —
 * mismo `dashboard/summary` que alimenta el badge del sidebar, ya enriquecido
 * con `userFullName` (los endpoints de `/absences` no lo traen). Reutiliza
 * `AbsenceApprovalList` (sin filtro; el filtro por tipo es solo de la
 * página de gestión, deck 05-ausencias-admin). */
export function AdminApprovalQueueCard({ requests }: { requests: PendingAbsenceRequestSummary[] }) {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Solicitudes de ausencia por aprobar ({requests.length})</CardTitle>
        <Link to="/ausencias" className={styles.link}>
          Ver todas
        </Link>
      </CardHeader>
      <CardContent>
        <AbsenceApprovalList requests={requests} />
      </CardContent>
    </Card>
  );
}
