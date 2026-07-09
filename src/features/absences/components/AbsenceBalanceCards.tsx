import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { AbsenceBalance, AbsenceType } from '../domain/models';
import styles from './AbsenceBalanceCards.module.css';

interface AbsenceBalanceCardsProps {
  types: AbsenceType[];
  balances: AbsenceBalance[];
}

/** Contador en tiempo real: una tarjeta por tipo con disponible/usado/pendiente. */
export function AbsenceBalanceCards({ types, balances }: AbsenceBalanceCardsProps) {
  const balanceByType = new Map(balances.map((b) => [b.absenceTypeId, b]));

  return (
    <div className={styles.grid}>
      {types.map((type) => {
        const balance = balanceByType.get(type.id);
        if (!balance) return null;

        const usedPct = balance.entitledDays > 0 ? (balance.usedDays / balance.entitledDays) * 100 : 0;
        const pendingPct =
          balance.entitledDays > 0 ? (balance.pendingDays / balance.entitledDays) * 100 : 0;

        return (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle style={type.color ? { color: type.color } : undefined}>
                {type.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={styles.available}>{balance.availableDays} días disponibles</p>
              {balance.entitledDays > 0 && (
                <div className={styles.barTrack}>
                  <div className={styles.barUsed} style={{ width: `${usedPct}%` }} />
                  <div
                    className={styles.barPending}
                    style={{ width: `${pendingPct}%`, left: `${usedPct}%` }}
                  />
                </div>
              )}
              <p className={styles.detail}>
                {balance.entitledDays} asignados · {balance.usedDays} usados ·{' '}
                {balance.pendingDays} pendientes
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
