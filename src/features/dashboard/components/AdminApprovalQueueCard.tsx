import { Link } from 'react-router-dom';
import { AbsenceApprovalList } from '@/features/absences/components/AbsenceApprovalList';
import type { PendingAbsenceRequestSummary } from '../domain/models';
import styles from './AdminApprovalQueueCard.module.css';

/**
 * "Solicitudes de ausencia por aprobar" del deck 02-home-admin-bandeja —
 * mismo `dashboard/summary` que alimenta el badge del sidebar, ya enriquecido
 * con `userFullName` (los endpoints de `/absences` no lo traen). Reutiliza
 * `AbsenceApprovalList` (sin filtro; el filtro por tipo es solo de la
 * página de gestión, deck 05-ausencias-admin).
 *
 * NO envuelve su contenido en una `Card`, aunque el nombre del componente lo
 * sugiera: vive dentro de una pestaña de `AdminHomeTabs`, que ya es una Card.
 * Antes sí lo hacía, y era la única de las tres pestañas que lo hacía — doble
 * marco y doble sombra en una sola pestaña, y su `<h3>` quedaba al mismo nivel
 * que el `<h3>` del contenedor que lo envuelve. De ahí el `<h4>`: este título
 * es subordinado al "Resumen operativo" de la Card, no su hermano.
 */
export function AdminApprovalQueueCard({ requests }: { requests: PendingAbsenceRequestSummary[] }) {
  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <h4 className={styles.title}>Solicitudes de ausencia por aprobar ({requests.length})</h4>
        <Link to="/ausencias" className={styles.link}>
          Ver todas
        </Link>
      </div>
      <AbsenceApprovalList requests={requests} />
    </div>
  );
}
