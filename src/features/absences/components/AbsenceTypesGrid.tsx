import { Plus } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { useUpdateAbsenceType } from '../application/useUpdateAbsenceType';
import type { AbsenceType } from '../domain/models';
import styles from './AbsenceTypesGrid.module.css';

function describe(type: AbsenceType): string {
  const balancePart =
    type.maxDaysPerYear != null
      ? `Máx. ${type.maxDaysPerYear} días/año`
      : type.affectsBalance
        ? 'Descuenta del cómputo'
        : 'No descuenta';
  const requirementPart = type.requiresApproval
    ? 'requiere aprobación'
    : type.requiresJustification
      ? 'requiere justificante'
      : null;
  return requirementPart ? `${balancePart} · ${requirementPart}` : balancePart;
}

interface AbsenceTypesGridProps {
  types: AbsenceType[];
  isLoading: boolean;
  onEdit: (type: AbsenceType) => void;
  onAdd: () => void;
}

/** deck-fase6/15-tipos-ausencia.png — grid de tarjetas, no tabla. Click en la
 * tarjeta abre edición; el switch (activo/inactivo) tiene su propio manejador
 * para no disparar también la edición. */
export function AbsenceTypesGrid({ types, isLoading, onEdit, onAdd }: AbsenceTypesGridProps) {
  const { mutate: updateType } = useUpdateAbsenceType();

  if (isLoading) {
    return <p className={styles.empty}>Cargando tipos de ausencia…</p>;
  }

  return (
    <div className={styles.grid}>
      {types.map((type) => (
        // Radix `Switch` renderiza un <button> — no puede vivir dentro de otro
        // <button> (HTML inválido: rompe el foco por teclado y la semántica
        // para lectores de pantalla). La tarjeta es un `div` con rol de botón.
        <div
          key={type.id}
          role="button"
          tabIndex={0}
          className={styles.card}
          onClick={() => onEdit(type)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEdit(type);
            }
          }}
        >
          <span className={styles.colorBar} style={{ backgroundColor: type.color ?? undefined }} />
          <span className={styles.cardBody}>
            <span className={styles.cardName}>{type.name}</span>
            <span className={styles.cardDescription}>{describe(type)}</span>
          </span>
          <span
            className={styles.switchWrapper}
            onClick={(e) => e.stopPropagation()}
          >
            <Switch
              checked={type.isActive}
              onCheckedChange={(checked) => updateType({ id: type.id, input: { isActive: checked } })}
              aria-label={`${type.isActive ? 'Desactivar' : 'Activar'} ${type.name}`}
            />
          </span>
        </div>
      ))}

      <button type="button" className={styles.addCard} onClick={onAdd}>
        <Plus />
        Añadir tipo de ausencia
      </button>
    </div>
  );
}
