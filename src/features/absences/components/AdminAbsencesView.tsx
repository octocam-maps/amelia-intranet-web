import { PlusIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDashboardSummary } from '@/features/dashboard/application/useDashboardSummary';
import { useAbsenceBalance } from '../application/useAbsenceBalance';
import { useAbsenceRequests } from '../application/useAbsenceRequests';
import { useAbsenceTypes } from '../application/useAbsenceTypes';
import { AbsenceApprovalList } from './AbsenceApprovalList';
import { AbsenceBalanceDonut } from './AbsenceBalanceDonut';
import { AbsenceRequestsTabs } from './AbsenceRequestsTabs';
import { NewAbsenceRequestDialog } from './NewAbsenceRequestDialog';
import { TeamAbsenceGantt } from './TeamAbsenceGantt';
import styles from './AdminAbsencesView.module.css';

/**
 * Vista de administrador — deck 05-ausencias-admin. La bandeja reutiliza
 * `dashboard/summary` (que ya trae `userFullName`); el gantt usa
 * `/absences/requests/all`, que ahora también lo trae (JOIN con `users` en
 * el backend) — ya no depende de la bandeja para resolver nombres.
 *
 * El administrador TAMBIÉN es plantilla, y desde el 2026-08-03 esta pantalla
 * lo refleja: hasta entonces solo mostraba la bandeja y el gantt, así que
 * quien administra las ausencias no tenía dónde pedir las suyas. La única vía
 * que le quedaba era el botón del `Topbar`, que solo aparece con un fichaje
 * abierto — la mayor parte del tiempo, ninguna.
 *
 * No hay nada que autorizar aquí: el backend ya le admite el `POST` y además
 * se lo autoaprueba, porque no existe un segundo aprobador por encima
 * (`docs/permisos-roles.md` § Excepción — autoaprobación del admin).
 */
export function AdminAbsencesView() {
  const { data: types = [] } = useAbsenceTypes();
  const { data: allRequests = [] } = useAbsenceRequests({ mode: 'all' });
  const { data: ownRequests = [] } = useAbsenceRequests({ mode: 'own' });
  const { data: balances = [] } = useAbsenceBalance();
  const { data: summary } = useDashboardSummary();

  const pendingRequests = summary?.pendingAbsenceRequests ?? [];

  // Mismo criterio que la vista de empleado y que la tarjeta "Vacaciones" de
  // Inicio: el resumen se calcula sobre el saldo de `vacaciones`, no sobre la
  // suma de todos los tipos.
  const vacationType = types.find((t) => t.code === 'vacaciones');
  const vacationBalance = vacationType
    ? balances.find((b) => b.absenceTypeId === vacationType.id)
    : undefined;
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Ausencias · gestión</h2>
          <p className={styles.subtitle}>
            Aprueba solicitudes, consulta el calendario de la plantilla y gestiona tus días
          </p>
        </div>
        <NewAbsenceRequestDialog
          trigger={
            <Button>
              <PlusIcon />
              Solicitar ausencia
            </Button>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis días {currentYear}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={styles.summaryRow}>
            <AbsenceBalanceDonut
              available={vacationBalance?.availableDays ?? 0}
              used={vacationBalance?.usedDays ?? 0}
              total={vacationBalance?.entitledDays ?? 0}
            />
            <div className={styles.summaryLegend}>
              <p className={styles.summaryItem}>
                <span className={styles.summaryDotAvailable} />
                Disponibles <b>{vacationBalance?.availableDays ?? 0}</b>
              </p>
              <p className={styles.summaryItem}>
                <span className={styles.summaryDotUsed} />
                Usados <b>{vacationBalance?.usedDays ?? 0}</b>
              </p>
            </div>
          </div>
          <div className={styles.summaryFooter}>
            <span>Base anual</span>
            <b>{vacationBalance?.entitledDays ?? 0} días laborables</b>
          </div>
        </CardContent>
      </Card>

      <AbsenceRequestsTabs requests={ownRequests} types={types} />

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes por aprobar ({pendingRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <AbsenceApprovalList requests={pendingRequests} filterable />
        </CardContent>
      </Card>

      <TeamAbsenceGantt requests={allRequests} types={types} />
    </div>
  );
}
