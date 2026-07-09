import { Coffee, Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatHms, useElapsedSeconds } from '@/hooks/useElapsedSeconds';
import { useClockIn, useClockOut, useEndBreak, useStartBreak } from '../application/useTimeClockLiveActions';
import { useTimeClockCurrent } from '../application/useTimeClockCurrent';
import styles from './LiveClockCard.module.css';

function formatClockInTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${String(mins).padStart(2, '0')}m`;
}

/**
 * Tarjeta grande de fichaje de Inicio (deck 01-home-empleado) — respalda el
 * mismo `/time-clock/current` que la pill del topbar, así que ambos
 * componentes se refrescan juntos con una sola invalidación de query.
 */
export function LiveClockCard() {
  const { data: status, isLoading } = useTimeClockCurrent();
  const { mutate: clockIn, isPending: isClockingIn } = useClockIn();
  const { mutate: clockOut, isPending: isClockingOut } = useClockOut();
  const { mutate: startBreak, isPending: isStartingBreak } = useStartBreak();
  const { mutate: endBreak, isPending: isEndingBreak } = useEndBreak();

  const openEntry = status?.openEntry ?? null;
  const elapsedSeconds = useElapsedSeconds(openEntry?.clockIn ?? null, openEntry?.onBreak ?? false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className={styles.loading}>Cargando fichaje…</CardContent>
      </Card>
    );
  }

  if (!openEntry) {
    return (
      <Card>
        <CardContent className={styles.root}>
          <div className={styles.info}>
            <p className={styles.label}>Fichaje de hoy</p>
            <p className={styles.detail}>Todavía no has fichado entrada.</p>
          </div>
          <Button variant="dark" disabled={isClockingIn} onClick={() => clockIn()}>
            <Play />
            Fichar entrada
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className={styles.root}>
        <div className={styles.statusIcon} data-on-break={openEntry.onBreak}>
          {openEntry.onBreak ? <Coffee /> : <Play />}
        </div>

        <div className={styles.info}>
          <p className={styles.label}>Fichaje de hoy · entrada {formatClockInTime(openEntry.clockIn)}</p>
          <div className={styles.timerRow}>
            <span className={styles.timer}>{formatHms(elapsedSeconds)}</span>
            <span className={styles.badge} data-on-break={openEntry.onBreak}>
              {openEntry.onBreak ? 'En pausa' : 'En jornada'}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          {status && (
            <p className={styles.weekTotal}>
              Esta semana {formatMinutes(status.weekWorkedMinutes)}/{formatMinutes(status.expectedWeeklyMinutes)}
            </p>
          )}
          <div className={styles.buttonRow}>
            {openEntry.onBreak ? (
              <Button variant="outline" disabled={isEndingBreak} onClick={() => endBreak()}>
                <Play />
                Reanudar
              </Button>
            ) : (
              <Button variant="outline" disabled={isStartingBreak} onClick={() => startBreak()}>
                <Pause />
                Pausa
              </Button>
            )}
            <Button variant="dark" disabled={isClockingOut} onClick={() => clockOut()}>
              <Square />
              Fichar salida
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
