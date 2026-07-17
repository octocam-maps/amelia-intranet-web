/** Formas tal cual las devuelve el backend (Pydantic) — ver
 * amelia-intranet-back/src/features/roles/infrastructure/schemas.py. */

export interface RoleDTO {
  code: string;
  name: string;
}

export interface RoleListDTO {
  roles: RoleDTO[];
}
