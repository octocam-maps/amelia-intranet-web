/**
 * Viaja tal cual desde `GET /departments` (tabla `departments` del backend,
 * fuente única) — mismo patrón que `features/roles/domain/models.ts`.
 * `entityCode` puede venir `null` si el departamento quedara sin entidad
 * resuelta (el JOIN del repositorio es LEFT por robustez).
 */
export interface Department {
  id: string;
  name: string;
  entityId: string;
  entityCode: string | null;
  /**
   * Catálogo 2026 (migración 054 del backend): `Software` y `Hardware`
   * cuelgan de `Producto`. `parentName` viene ya resuelto por el JOIN del
   * backend para que agrupar no obligue a cruzar la lista consigo misma
   * buscando el padre por id.
   */
  parentDepartmentId: string | null;
  parentName: string | null;
}

/** Un grupo del selector: o un departamento raíz suelto, o un padre con sus
 * hijos. */
export interface DepartmentGroup {
  parentName: string | null;
  departments: Department[];
}

/**
 * Agrupa la lista plana del backend para pintarla como `Producto > Software`.
 *
 * Conserva el ORDEN que viene del backend en vez de reordenar aquí: el
 * `ORDER BY` del repositorio ya deja cada hoja pegada a su padre, y volver a
 * ordenar en el cliente crearía una segunda fuente de verdad que puede
 * discrepar de la primera.
 */
export function groupDepartments(departments: Department[]): DepartmentGroup[] {
  const groups: DepartmentGroup[] = [];

  for (const department of departments) {
    const key = department.parentName;
    const last = groups.at(-1);
    if (last && last.parentName === key) {
      last.departments.push(department);
    } else {
      groups.push({ parentName: key, departments: [department] });
    }
  }

  return groups;
}
