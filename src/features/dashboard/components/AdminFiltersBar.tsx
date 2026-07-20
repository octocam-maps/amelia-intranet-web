import { BuildingIcon, FilterIcon } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useOrgFilterOptions } from '../application/useOrgFilterOptions';
import type { OrgDepartmentOption } from '../domain/models';
import styles from './AdminFiltersBar.module.css';

const ALL_VALUE = 'all';

export interface AdminHomeFiltersValue {
  entityId?: string;
  departmentIds?: string[];
}

interface AdminFiltersBarProps {
  value: AdminHomeFiltersValue;
  onChange: (value: AdminHomeFiltersValue) => void;
}

interface DepartmentGroup {
  name: string;
  ids: string[];
}

/** Cada nombre de departamento existe una vez POR SEDE (5 nombres × 3 sedes
 * = 15 `department_id` reales) — sin sede elegida se verían repetidos 3
 * veces. Se agrupan por nombre para mostrar cada uno una sola vez; al
 * elegirlo se filtra por TODOS los ids que lo comparten (ver
 * `AdminMetricsFilters.departmentIds`). */
function groupDepartmentsByName(departments: OrgDepartmentOption[]): DepartmentGroup[] {
  const idsByName = new Map<string, string[]>();
  for (const department of departments) {
    const ids = idsByName.get(department.name) ?? [];
    ids.push(department.id);
    idsByName.set(department.name, ids);
  }
  return [...idsByName.entries()]
    .map(([name, ids]) => ({ name, ids }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
}

/**
 * Filtros globales del Home admin (Sede/Departamento) — cabecera del brief.
 * No hay catálogo dedicado de entidades/departamentos todavía: las opciones
 * se resuelven a partir de la plantilla real (`useOrgFilterOptions`, ver
 * `infrastructure/dashboard-api.adapter.ts`). El Departamento se acota a la
 * Sede elegida; cambiar de Sede reintenta mantener el mismo nombre elegido
 * (mismo departamento, otra sede) y lo limpia si ya no existe ahí.
 */
export function AdminFiltersBar({ value, onChange }: AdminFiltersBarProps) {
  const { data: options, isLoading } = useOrgFilterOptions();
  const entities = options?.entities ?? [];
  const allDepartments = options?.departments ?? [];
  const departmentsForEntity = allDepartments.filter(
    (department) => !value.entityId || department.entityId === value.entityId
  );
  const departmentGroups = groupDepartmentsByName(departmentsForEntity);

  // Los ids de `value.departmentIds` comparten nombre (los puso este mismo
  // componente) — alcanza con mirar el primero para saber qué nombre está
  // seleccionado.
  const selectedDepartmentName = value.departmentIds?.length
    ? allDepartments.find((d) => d.id === value.departmentIds![0])?.name
    : undefined;

  const handleEntityChange = (next: string) => {
    const entityId = next === ALL_VALUE ? undefined : next;
    const newDepartmentsForEntity = allDepartments.filter(
      (department) => !entityId || department.entityId === entityId
    );
    const matchingGroup = selectedDepartmentName
      ? groupDepartmentsByName(newDepartmentsForEntity).find((group) => group.name === selectedDepartmentName)
      : undefined;
    onChange({ entityId, departmentIds: matchingGroup?.ids });
  };

  const handleDepartmentChange = (next: string) => {
    if (next === ALL_VALUE) {
      onChange({ ...value, departmentIds: undefined });
      return;
    }
    const group = departmentGroups.find((g) => g.name === next);
    onChange({ ...value, departmentIds: group?.ids });
  };

  return (
    <div className={styles.bar}>
      <span className={styles.label}>
        <FilterIcon className={styles.labelIcon} />
        Filtrar por
      </span>

      <div className={styles.field}>
        <BuildingIcon className={styles.fieldIcon} />
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
          value={selectedDepartmentName ?? ALL_VALUE}
          onValueChange={handleDepartmentChange}
          disabled={isLoading || departmentGroups.length === 0}
        >
          <SelectTrigger className={styles.trigger} aria-label="Filtrar por departamento">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Todos los departamentos</SelectItem>
            {departmentGroups.map((group) => (
              <SelectItem key={group.name} value={group.name}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
