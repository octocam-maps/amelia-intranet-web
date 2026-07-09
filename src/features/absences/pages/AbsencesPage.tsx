import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/store';
import { useAbsenceBalance } from '../application/useAbsenceBalance';
import { useAbsenceRequests } from '../application/useAbsenceRequests';
import { useAbsenceTypes } from '../application/useAbsenceTypes';
import { AbsenceApprovalTray } from '../components/AbsenceApprovalTray';
import { AbsenceBalanceCards } from '../components/AbsenceBalanceCards';
import { AbsenceCalendar } from '../components/AbsenceCalendar';
import { AbsenceRequestForm } from '../components/AbsenceRequestForm';
import { AbsenceRequestList } from '../components/AbsenceRequestList';
import styles from './AbsencesPage.module.css';

export function AbsencesPage() {
  const isAdmin = useStore((s) => s.user?.role === 'administrador');

  const { data: types = [] } = useAbsenceTypes();
  const { data: balances = [] } = useAbsenceBalance();
  const { data: ownRequests = [] } = useAbsenceRequests({ mode: 'own' });

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Ausencias</h1>

      <AbsenceBalanceCards types={types} balances={balances} />

      <div className={styles.columns}>
        <Card>
          <CardHeader>
            <CardTitle>Solicitar ausencia</CardTitle>
          </CardHeader>
          <CardContent>
            <AbsenceRequestForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <AbsenceCalendar requests={ownRequests} types={types} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          <AbsenceRequestList requests={ownRequests} types={types} />
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Bandeja de aprobación</CardTitle>
          </CardHeader>
          <CardContent>
            <AbsenceApprovalTray />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
