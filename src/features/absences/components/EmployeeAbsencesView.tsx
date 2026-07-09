import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useDashboardSummary } from '@/features/dashboard/application/useDashboardSummary';
import { useAbsenceBalance } from '../application/useAbsenceBalance';
import { useAbsenceRequests } from '../application/useAbsenceRequests';
import { useAbsenceTypes } from '../application/useAbsenceTypes';
import { AbsenceBalanceDonut } from './AbsenceBalanceDonut';
import { AbsenceCompactList } from './AbsenceCompactList';
import { AbsenceYearCalendar } from './AbsenceYearCalendar';
import { NewAbsenceRequestDialog } from './NewAbsenceRequestDialog';
import styles from './EmployeeAbsencesView.module.css';

/** Vista de empleado — deck 03-ausencias-empleado. El "Resumen de días"
 * (donut + base anual) se calcula sobre el saldo de `vacaciones`
 * específicamente, igual que la tarjeta "Vacaciones 2026" de Inicio. */
export function EmployeeAbsencesView() {
  const { data: types = [] } = useAbsenceTypes();
  const { data: balances = [] } = useAbsenceBalance();
  const { data: requests = [] } = useAbsenceRequests({ mode: 'own' });
  const { data: summary } = useDashboardSummary();

  const vacationType = types.find((t) => t.code === 'vacaciones');
  const vacationBalance = vacationType ? balances.find((b) => b.absenceTypeId === vacationType.id) : undefined;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ausencias y vacaciones</h1>
          <p className={styles.subtitle}>Gestiona tus días libres</p>
        </div>
        <NewAbsenceRequestDialog
          trigger={
            <Button>
              <Plus />
              Solicitar ausencia
            </Button>
          }
        />
      </div>

      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          <Card>
            <CardHeader>
              <CardTitle>Resumen de días {new Date().getFullYear()}</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Mis ausencias</CardTitle>
            </CardHeader>
            <CardContent>
              <AbsenceCompactList requests={requests} types={types} />
            </CardContent>
          </Card>
        </div>

        <div className={styles.rightColumn}>
          <AbsenceYearCalendar requests={requests} types={types} holidays={summary?.upcomingHolidays ?? []} />
        </div>
      </div>
    </div>
  );
}
