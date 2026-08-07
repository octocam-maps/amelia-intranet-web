import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatCompensationDays, formatMinutes } from '../domain/technicianLog';
import type { CompensationBalance, TechnicianMonthSummary } from '../domain/models';
import styles from './TechnicianSummaryCards.module.css';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

interface MonthBudgetCardProps {
  summary: TechnicianMonthSummary;
}

/**
 * Consumo del mes sobre la bolsa de 162 h.
 *
 * La barra se detiene en el 100 % y el exceso se comunica APARTE, como horas
 * extra: una barra que sigue creciendo más allá del objetivo deja de ser una
 * barra de progreso y no dice ni cuánto sobra ni sobre qué.
 */
export function MonthBudgetCard({ summary }: MonthBudgetCardProps) {
  const percent = Math.min(100, Math.round((summary.workedMinutes / summary.budgetMinutes) * 100));
  const exceeded = summary.overtimeMinutes > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Horas de {MONTH_NAMES[summary.month - 1]} de {summary.year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={styles.big}>
          {formatMinutes(summary.workedMinutes)}
          <span className={styles.of}> de {formatMinutes(summary.budgetMinutes)}</span>
        </p>

        <div
          className={styles.track}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Consumo de la bolsa mensual"
        >
          <div
            className={exceeded ? styles.barExceeded : styles.bar}
            style={{ width: `${percent}%` }}
          />
        </div>

        <dl className={styles.stats}>
          <div>
            <dt>Restantes</dt>
            <dd>{formatMinutes(summary.remainingMinutes)}</dd>
          </div>
          {exceeded && (
            <div>
              <dt className={styles.warning}>Horas extra</dt>
              <dd className={styles.warning}>{formatMinutes(summary.overtimeMinutes)}</dd>
            </div>
          )}
          <div>
            <dt>Pernoctas en España</dt>
            <dd>{summary.overnightStaysSpain}</dd>
          </div>
          <div>
            <dt>Pernoctas fuera</dt>
            <dd>{summary.overnightStaysAbroad}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

interface CompensationBalanceCardProps {
  balance: CompensationBalance;
}

/**
 * Saldo ANUAL de descanso por horas extra.
 *
 * El año va en el TÍTULO del bloque, no en una nota al pie: el requerimiento
 * insiste en que quede claro que este contador es anual y no mensual, y eso se
 * resuelve nombrándolo donde primero se mira, no aclarándolo debajo.
 */
export function CompensationBalanceCard({ balance }: CompensationBalanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Descanso compensatorio acumulado — {balance.year}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={styles.big}>
          {formatMinutes(balance.availableMinutes)}
          <span className={styles.of}>
            {' '}
            ({formatCompensationDays(balance.availableMinutes)})
          </span>
        </p>

        <dl className={styles.stats}>
          <div>
            <dt>Devengado en el año</dt>
            <dd>{formatMinutes(balance.accruedMinutes)}</dd>
          </div>
          <div>
            <dt>Ya disfrutado</dt>
            <dd>{formatMinutes(balance.consumedMinutes)}</dd>
          </div>
        </dl>

        {balance.pendingMinutes > 0 && (
          <p className={styles.pending}>
            El mes en curso lleva {formatMinutes(balance.pendingMinutes)} pendientes de
            consolidar: no cuentan hasta que termine el mes.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
