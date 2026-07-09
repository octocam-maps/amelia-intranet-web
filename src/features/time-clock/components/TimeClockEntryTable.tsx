import { Badge } from '@/components/ui/Badge';
import type { TimeClockEntry } from '../domain/models';
import styles from './TimeClockEntryTable.module.css';

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, '0')}m`;
}

interface TimeClockEntryTableProps {
  entries: TimeClockEntry[];
  /** Vista aumentada del admin — sin directorio (Fase 5), se muestra el id truncado. */
  showUserColumn?: boolean;
  onDelete?: (entryId: string) => void;
}

export function TimeClockEntryTable({ entries, showUserColumn, onDelete }: TimeClockEntryTableProps) {
  if (entries.length === 0) {
    return <p className={styles.empty}>Todavía no hay tramos registrados en este rango.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Fecha</th>
          {showUserColumn && <th>Empleado</th>}
          <th>Entrada</th>
          <th>Salida</th>
          <th>Duración</th>
          {onDelete && <th aria-label="Acciones" />}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{entry.workDate}</td>
            {showUserColumn && <td className={styles.userId}>{entry.userId.slice(0, 8)}…</td>}
            <td>{formatTime(entry.clockIn)}</td>
            <td>
              {entry.clockOut ? formatTime(entry.clockOut) : <Badge variant="warning">Abierto</Badge>}
            </td>
            <td>{formatMinutes(entry.workedMinutes)}</td>
            {onDelete && (
              <td>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => onDelete(entry.id)}
                >
                  Eliminar
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
