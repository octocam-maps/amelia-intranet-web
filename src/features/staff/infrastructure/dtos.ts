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
  /** `null` = desconocido, NO jornada completa — ver `contractType.ts`. */
  contract_type: string | null;
  department_id: string | null;
  department_name: string | null;
  entity_id: string | null;
  entity_code: string | null;
  role_id: string;
  role_code: string;
  status: string;
  hire_date: string | null;
  /** Entitlement EFECTIVO y vigente (override si lo hay, si no el
   * calculado) — fuente única: `absence_balances.entitled_days`. */
  vacation_days_per_year: number | null;
  /** Override manual del admin. `null` = automático (calculado desde
   * `hire_date`). Distinto de `vacation_days_per_year` (ver arriba). */
  vacation_days_override: number | null;
  /** Lo que daría el cálculo automático AHORA MISMO, exista o no un
   * override — para mostrarlo en el formulario sin reimplementar la
   * fórmula de negocio en el frontend. */
  vacation_days_calculated: number;
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
  contract_type?: string | null;
  department?: string | null;
  entity: string;
  role: string;
  hire_date?: string | null;
  /** Vacío/`null` = automático (calculado desde `hire_date`); un número =
   * override manual. */
  vacation_days_override?: number | null;
}

/** Body de `PATCH /staff/{id}` — sin `full_name`/`email` (el backend no
 * permite editarlos aquí); aquí sí existen `hire_date` e `is_active`.
 *
 * `vacation_days_override` AUSENTE del payload -> no toca el override;
 * `vacation_days_override: null` explícito -> lo vacía (vuelve a
 * automático); un número -> lo fija. El backend distingue "ausente" de
 * "null" con `model_fields_set` — por eso el mapper (`updateStaffMemberInputToDTO`)
 * solo incluye esta clave cuando el input trae un valor distinto de
 * `undefined` (puede ser `null`).
 *
 * `contract_type` sigue el mismo esquema de tres estados: clave AUSENTE ->
 * no tocar; `contract_type: null` explícito -> lo vacía (vuelve a "sin
 * especificar"); un valor -> lo fija. */
export interface UpdateStaffMemberDTO {
  job_title?: string | null;
  contract_type?: string | null;
  department?: string | null;
  entity?: string;
  role?: string;
  /** Sin el esquema de tres estados de los de arriba: aquí `null` es "no
   * tocar". La fecha de alta se fija y se corrige, pero no se vacía. */
  hire_date?: string | null;
  vacation_days_override?: number | null;
  is_active?: boolean;
}

/** `GET /staff/{id}/role-history` — ver `RoleChangeDTO` en schemas.py. */
export interface RoleChangeDTO {
  id: string;
  from_role_code: string | null;
  to_role_code: string;
  changed_by_id: string | null;
  changed_by_name: string | null;
  changed_at: string;
  note: string | null;
}

export interface RoleChangeListDTO {
  changes: RoleChangeDTO[];
}
