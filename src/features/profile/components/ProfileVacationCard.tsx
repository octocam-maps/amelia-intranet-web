import { Waves } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAbsenceBalance } from '@/features/absences/application/useAbsenceBalance';
import { useAbsenceTypes } from '@/features/absences/application/useAbsenceTypes';
import styles from './ProfileVacationCard.module.css';

/**
 * Mismo criterio que `VacationSummaryCard` de Inicio: el saldo que importa
 * de un vistazo es el de `vacaciones` específicamente, no la suma de todos
 * los tipos de ausencia. Un externo-invitado no tiene acceso a
 * `/absences/*` — `isError` cubre ese caso con un estado honesto, sin
 * romper la página.
 */
export function ProfileVacationCard() {
  const { data: types, isLoading: isLoadingTypes, isError: isErrorTypes } = useAbsenceTypes();
  const { data: balances, isLoading: isLoadingBalance, isError: isErrorBalance } = useAbsenceBalance();

  const isLoading = isLoadingTypes || isLoadingBalance;
  const isError = isErrorTypes || isErrorBalance;

  const vacationType = types?.find((type) => type.code === 'vacaciones');
  const vacationBalance = vacationType
    ? balances?.find((balance) => balance.absenceTypeId === vacationType.id)
    : undefined;

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Vacaciones {new Date().getFullYear()}</CardTitle>
        <Waves className={styles.headerIcon} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className={styles.empty}>Cargando tu saldo…</p>
        ) : isError || !vacationBalance ? (
          <p className={styles.empty}>Sin datos de vacaciones.</p>
        ) : (
          <>
            <p className={styles.available}>
              <span className={styles.availableNumber}>{vacationBalance.availableDays}</span>
              {' '}días disponibles
            </p>
            <div className={styles.barTrack}>
              <div
                className={styles.barUsed}
                style={{
                  width:
                    vacationBalance.entitledDays > 0
                      ? `${(vacationBalance.usedDays / vacationBalance.entitledDays) * 100}%`
                      : '0%',
                }}
              />
            </div>
            <p className={styles.detail}>
              {vacationBalance.usedDays} usados · {vacationBalance.entitledDays} totales
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
