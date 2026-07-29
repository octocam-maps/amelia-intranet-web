import { Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';
import { Badge } from '@/components/ui/Badge';
import type { Holiday } from '../domain/models';
import { SCOPE_BADGE_VARIANT, SCOPE_LABEL } from '../domain/scope';
import styles from './HolidaysTable.module.css';

function formatShortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  const date = new Date(Number(iso.slice(0, 4)), Number(month) - 1, Number(day));
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

interface HolidaysTableProps {
  holidays: Holiday[];
  isLoading: boolean;
  /** Año que se está mostrando — solo para el mensaje de lista vacía. */
  year: number;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
}

export function HolidaysTable({ holidays, isLoading, year, onEdit, onDelete }: HolidaysTableProps) {
  if (isLoading) {
    return <p className={styles.empty}>Cargando festivos…</p>;
  }
  if (holidays.length === 0) {
    return <p className={styles.empty}>No hay festivos configurados para {year}. Impórtalos o añádelos a mano.</p>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Festivo</th>
          <th>Ámbito</th>
          <th>Origen</th>
          <th aria-label="Acciones" />
        </tr>
      </thead>
      <tbody>
        {holidays.map((holiday) => (
          <tr key={holiday.id}>
            <td className={styles.date}>{formatShortDate(holiday.date)}</td>
            <td>{holiday.name}</td>
            <td>
              {holiday.scope ? (
                <Badge variant={SCOPE_BADGE_VARIANT[holiday.scope]}>
                  {SCOPE_LABEL[holiday.scope]}
                </Badge>
              ) : (
                <span className={styles.muted}>—</span>
              )}
            </td>
            <td>
              <Badge variant={holiday.source === 'oficial' ? 'info' : 'outline'}>
                {holiday.source === 'oficial' ? 'Oficial' : 'Manual'}
              </Badge>
            </td>
            <td>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => onEdit(holiday)}
                  aria-label={`Editar ${holiday.name}`}
                >
                  <Pencil2Icon />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => onDelete(holiday)}
                  aria-label={`Eliminar ${holiday.name}`}
                >
                  <TrashIcon />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
