import { WavesIcon } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { VacationBalance } from '../domain/models';
import styles from './VacationSummaryCard.module.css';

interface VacationSummaryCardProps {
  title: string;
  balance: VacationBalance | null;
}

/** "Vacaciones 2026" (Inicio empleado) / "Tus vacaciones 2026" (Inicio
 * admin) — misma tarjeta, solo cambia el título (deck 01 y 02). */
export function VacationSummaryCard({ title, balance }: VacationSummaryCardProps) {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>{title}</CardTitle>
        <WavesIcon className={styles.icon} />
      </CardHeader>
      <CardContent>
        {balance ? (
          <>
            <p className={styles.available}>
              <span className={styles.availableNumber}>{balance.availableDays}</span> días disponibles
            </p>
            <div className={styles.barTrack}>
              <div
                className={styles.barUsed}
                style={{
                  width: balance.entitledDays > 0 ? `${(balance.usedDays / balance.entitledDays) * 100}%` : '0%',
                }}
              />
            </div>
            <p className={styles.detail}>
              {balance.usedDays} usados · {balance.entitledDays} totales
            </p>
          </>
        ) : (
          <p className={styles.detail}>Todavía no tienes saldo de vacaciones registrado.</p>
        )}
      </CardContent>
    </Card>
  );
}
