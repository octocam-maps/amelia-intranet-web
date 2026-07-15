import { Building2, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useOrgFilterOptions } from '../application/useOrgFilterOptions';
import styles from './AdminFiltersBar.module.css';

const ALL_VALUE = 'all';

export interface AdminHomeFiltersValue {
  entityId?: string;
  departmentId?: string;
}

interface AdminFiltersBarProps {
  value: AdminHomeFiltersValue;
  onChange: (value: AdminHomeFiltersValue) => void;
}

/**
 * Filtros globales del Home admin (Sede/Departamento) — cabecera del brief.
 * No hay catálogo dedicado de entidades/departamentos todavía: las opciones
 * se resuelven a partir de la plantilla real (`useOrgFilterOptions`, ver
 * `infrastructure/dashboard-api.adapter.ts`). El Departamento se acota a la
 * Sede elegida; cambiar de Sede limpia el Departamento si ya no aplica.
 */
export function AdminFiltersBar({ value, onChange }: AdminFiltersBarProps) {
  const { data: options, isLoading } = useOrgFilterOptions();
  const entities = options?.entities ?? [];
  const departments = (options?.departments ?? []).filter(
    (department) => !value.entityId || department.entityId === value.entityId
  );

  const handleEntityChange = (next: string) => {
    const entityId = next === ALL_VALUE ? undefined : next;
    const departmentStillValid =
      !value.departmentId ||
      (options?.departments ?? []).some((d) => d.id === value.departmentId && (!entityId || d.entityId === entityId));
    onChange({ entityId, departmentId: departmentStillValid ? value.departmentId : undefined });
  };

  const handleDepartmentChange = (next: string) => {
    onChange({ ...value, departmentId: next === ALL_VALUE ? undefined : next });
  };

  return (
    <div className={styles.bar}>
      <span className={styles.label}>
        <Filter className={styles.labelIcon} />
        Filtrar por
      </span>

      <div className={styles.field}>
        <Building2 className={styles.fieldIcon} />
        <Select value={value.entityId ?? ALL_VALUE} onValueChange={handleEntityChange} disabled={isLoading}>
          <SelectTrigger className={styles.trigger} aria-label="Filtrar por sede">
            <SelectValue placeholder="Sede" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todas las sedes</SelectItem>
            {entities.map((entity) => (
              <SelectItem key={entity.id} value={entity.id}>
                {entity.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={styles.field}>
        <Select
          value={value.departmentId ?? ALL_VALUE}
          onValueChange={handleDepartmentChange}
          disabled={isLoading || departments.length === 0}
        >
          <SelectTrigger className={styles.trigger} aria-label="Filtrar por departamento">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos los departamentos</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
