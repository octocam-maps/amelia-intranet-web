import { useMemo } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './PersonMultiSelect.module.css';

interface Person {
  id: string;
  fullName: string;
}

interface PersonMultiSelectProps {
  people: Person[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}

/** Filtro de personas de la vista admin "toda la plantilla" (Control
 * horario) — a diferencia de `@/components/ui/Select` (Radix Select, un
 * único valor), este permite marcar VARIAS personas a la vez. Radix Select
 * no soporta multi-selección nativamente, así que se construye sobre
 * `DropdownMenuPrimitive.CheckboxItem` en su lugar, con el mismo aspecto
 * (mismos tokens de color/borde que el resto de desplegables del feature). */
export function PersonMultiSelect({
  people,
  selectedIds,
  onChange,
  className,
}: PersonMultiSelectProps) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(id: string) {
    onChange(
      selectedSet.has(id) ? selectedIds.filter((existing) => existing !== id) : [...selectedIds, id]
    );
  }

  const label = useMemo(() => {
    if (selectedIds.length === 0) return 'Todas las personas';
    if (selectedIds.length === 1) {
      return people.find((person) => person.id === selectedIds[0])?.fullName ?? '1 persona';
    }
    return `${selectedIds.length} personas seleccionadas`;
  }, [selectedIds, people]);

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(styles.trigger, className)}
          aria-label="Filtrar por persona"
        >
          <Users className={styles.triggerLeadingIcon} />
          <span className={styles.triggerLabel}>{label}</span>
          <ChevronDown className={styles.triggerIcon} />
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content align="start" sideOffset={6} className={styles.content}>
          <DropdownMenuPrimitive.CheckboxItem
            className={styles.item}
            checked={selectedIds.length === 0}
            // Evita que Radix cierre el menú al marcar/desmarcar — el
            // usuario necesita poder seguir eligiendo más de una persona
            // sin reabrir el desplegable cada vez.
            onSelect={(event) => event.preventDefault()}
            onCheckedChange={() => onChange([])}
          >
            <span className={styles.itemIndicator}>
              {selectedIds.length === 0 && <Check className={styles.checkIcon} />}
            </span>
            Todas las personas
          </DropdownMenuPrimitive.CheckboxItem>

          {people.length > 0 && <DropdownMenuPrimitive.Separator className={styles.separator} />}

          {people.map((person) => (
            <DropdownMenuPrimitive.CheckboxItem
              key={person.id}
              className={styles.item}
              checked={selectedSet.has(person.id)}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={() => toggle(person.id)}
            >
              <span className={styles.itemIndicator}>
                {selectedSet.has(person.id) && <Check className={styles.checkIcon} />}
              </span>
              {person.fullName}
            </DropdownMenuPrimitive.CheckboxItem>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
