import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Holiday, HolidayScope } from '../domain/models';
import styles from './HolidaysTable.module.css';

const SCOPE_LABEL: Record<HolidayScope, string> = {
  nacional: 'Nacional',
  autonomico: 'Autonómico',
  local: 'Local',
  empresa: 'Empresa',
};

// deck-fase6/14-festivos.png § leyenda — nacional en navy sólido, autonómico
// en verde, local en naranja. Reutiliza los variantes de Badge existentes.
const SCOPE_BADGE_VARIANT: Record<HolidayScope, 'dark' | 'success' | 'warning' | 'info'> = {
  nacional: 'dark',
  autonomico: 'success',
  local: 'warning',
  empresa: 'info',
};

function formatShortDate(iso: string): string {
  const [, month, day] = iso.split('-');
  const date = new Date(Number(iso.slice(0, 4)), Number(month) - 1, Number(day));
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
}

interface HolidaysTableProps {
  holidays: Holiday[];
  isLoading: boolean;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
}

export function HolidaysTable({ holidays, isLoading, onEdit, onDelete }: HolidaysTableProps) {
  if (isLoading) {
    return <p className={styles.empty}>Cargando festivos…</p>;
  }
  if (holidays.length === 0) {
    return <p className={styles.empty}>No hay festivos configurados para este año.</p>;
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
                  <Pencil />
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => onDelete(holiday)}
                  aria-label={`Eliminar ${holiday.name}`}
                >
                  <Trash2 />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
