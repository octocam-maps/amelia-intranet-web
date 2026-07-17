/**
 * Formas snake_case tal cual las devuelve/espera el backend (Pydantic).
 * Contrato verificado contra
 * amelia-intranet-back/src/features/staff/infrastructure/schemas.py — no
 * inventar campos que el backend no manda (p. ej. NO hay `entity_name` ni
 * `is_active` en la respuesta; NO hay `page`/`page_size` en la lista).
 */

export interface StaffMemberDTO {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  job_title: string | null;
  department_id: string | null;
  department_name: string | null;
  entity_id: string | null;
  entity_code: string | null;
  role_id: string;
  role_code: string;
  status: string;
  hire_date: string | null;
  vacation_days_per_year: number | null;
}

export interface StaffListDTO {
  members: StaffMemberDTO[];
  total: number;
}

/** Body de `POST /staff` — el campo es `entity`/`role` (código), no
 * `entity_code`, y no admite `is_active` (el alta siempre crea activo). */
export interface CreateStaffMemberDTO {
  full_name: string;
  email: string;
  job_title?: string | null;
  department?: string | null;
  entity: string;
  role: string;
  hire_date?: string | null;
  vacation_days_per_year?: number | null;
}

/** Body de `PATCH /staff/{id}` — sin `full_name`/`email`/`hire_date` (el
 * backend no permite editarlos aquí); aquí sí existe `is_active`. */
export interface UpdateStaffMemberDTO {
  job_title?: string | null;
  department?: string | null;
  entity?: string;
  role?: string;
  vacation_days_per_year?: number | null;
  is_active?: boolean;
}
