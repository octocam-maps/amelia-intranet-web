import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDashboardSummary } from '@/features/dashboard/application/useDashboardSummary';
import { useAbsenceRequests } from '../application/useAbsenceRequests';
import { useAbsenceTypes } from '../application/useAbsenceTypes';
import { AbsenceApprovalList } from './AbsenceApprovalList';
import { TeamAbsenceGantt } from './TeamAbsenceGantt';
import styles from './AdminAbsencesView.module.css';

/**
 * Vista de administrador — deck 05-ausencias-admin. La bandeja reutiliza
 * `dashboard/summary` (con `userFullName`, que `/absences/requests/pending`
 * no trae); el gantt usa `/absences/requests/all` y resuelve el nombre de
 * quien SÍ conoce por esa misma bandeja — el resto queda como
 * "Empleado #XXXX" hasta que exista un directorio real (módulo Equipo).
 */
export function AdminAbsencesView() {
  const { data: types = [] } = useAbsenceTypes();
  const { data: allRequests = [] } = useAbsenceRequests({ mode: 'all' });
  const { data: summary } = useDashboardSummary();

  const pendingRequests = summary?.pendingAbsenceRequests ?? [];
  const nameById = useMemo(
    () => new Map((summary?.pendingAbsenceRequests ?? []).map((r) => [r.userId, r.userFullName])),
    [summary?.pendingAbsenceRequests]
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ausencias · gestión</h1>
        <p className={styles.subtitle}>Aprueba solicitudes y consulta el calendario de la plantilla</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes por aprobar ({pendingRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AbsenceApprovalList requests={pendingRequests} filterable />
        </CardContent>
      </Card>

      <TeamAbsenceGantt requests={allRequests} types={types} nameById={nameById} />
    </div>
  );
}
