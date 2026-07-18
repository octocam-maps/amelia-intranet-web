/** Formas tal cual las devuelve el backend (Pydantic) — ver
 * amelia-intranet-back/src/features/departments/infrastructure/schemas.py. */

export interface DepartmentDTO {
  id: string;
  name: string;
  entity_id: string;
  entity_code: string | null;
}

export interface DepartmentListDTO {
  departments: DepartmentDTO[];
}
