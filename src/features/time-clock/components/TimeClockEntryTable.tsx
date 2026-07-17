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
  /** Vista aumentada del admin — muestra el nombre resuelto por el backend
   * (JOIN a `users`); si por lo que sea no llega, cae al id truncado en vez
   * de dejar la celda vacía (X-BUG, Lote 1). */
  showUserColumn?: boolean;
  onDelete?: (entryId: string) => void;
  /** B-2c: solo el admin, sobre el fichaje AJENO de "Ver toda la plantilla"
   * — abre el diálogo de corrección de horas. El backend ya lo permite para
   * cualquier usuario si el rol es admin (`UpdateTimeClockEntryUseCase`);
   * aquí solo se cablea el botón. */
  onEdit?: (entry: TimeClockEntry) => void;
  /** B-2b: solo el admin — abre el panel de incidencias/comentarios del
   * tramo (ver y añadir). */
  onOpenNotes?: (entry: TimeClockEntry) => void;
}

export function TimeClockEntryTable({
  entries,
  showUserColumn,
  onDelete,
  onEdit,
  onOpenNotes,
}: TimeClockEntryTableProps) {
  if (entries.length === 0) {
    return <p className={styles.empty}>Todavía no hay tramos registrados en este rango.</p>;
  }

  const hasActions = Boolean(onDelete || onEdit || onOpenNotes);

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Fecha</th>
          {showUserColumn && <th>Empleado</th>}
          <th>Entrada</th>
          <th>Salida</th>
          <th>Duración</th>
          {hasActions && <th aria-label="Acciones" />}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{entry.workDate}</td>
            {showUserColumn && (
              <td className={entry.fullName ? undefined : styles.userId}>
                {entry.fullName ?? `${entry.userId.slice(0, 8)}…`}
              </td>
            )}
            <td>{formatTime(entry.clockIn)}</td>
            <td>
              {entry.clockOut ? formatTime(entry.clockOut) : <Badge variant="warning">Abierto</Badge>}
            </td>
            <td>{formatMinutes(entry.workedMinutes)}</td>
            {hasActions && (
              <td>
                {/* BUG: `display: flex` iba directo en el `<td>` — un
                    `<td>` con `display` distinto de `table-cell` deja de
                    comportarse como celda de tabla (pierde la altura/
                    alineación que le da el `border-collapse` de la fila),
                    así que el `border-bottom` de esta celda quedaba a una
                    altura distinta que el resto de columnas ("línea" por
                    encima de los botones, cuadrícula torcida). El flex vive
                    en un `<div>` DENTRO del `<td>`, que sigue siendo una
                    celda normal. */}
                <div className={styles.actionsCell}>
                  {onOpenNotes && (
                    <button
                      type="button"
                      className={styles.notesButton}
                      onClick={() => onOpenNotes(entry)}
                    >
                      Incidencias
                    </button>
                  )}
                  {onEdit && (
                    <button type="button" className={styles.editButton} onClick={() => onEdit(entry)}>
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      className={styles.deleteButton}
                      onClick={() => onDelete(entry.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
