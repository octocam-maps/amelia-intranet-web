import type { UserRole } from '@/features/auth/domain/models';

// `EntityCode` es del módulo canónico `lib/entities`, no de esta feature: la
// lista estaba duplicada en cinco y añadir la cuarta sociedad obligaba a
// acordarse de todas. Se importa Y se reexporta para que los consumidores
// actuales sigan importándolo desde aquí sin cambios.
import type { EntityCode } from '@/lib/entities';
import type { ContractType } from './contractType';

export type { EntityCode, ContractType };

/** Estado real de `users.status` (backend) — NO "activa/vacaciones/baja". */
export type StaffStatus = 'active' | 'invited' | 'suspended';

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  /** `null` = desconocido, NO jornada completa — ver `contractType.ts`. */
  contractType: ContractType | null;
  departmentId: string | null;
  /** Nombre del departamento — el backend solo manda el nombre resuelto,
   * no un objeto de departamento completo. */
  departmentName: string | null;
  entityId: string | null;
  entityCode: EntityCode | null;
  /** El backend NO manda `entity_name` — se deriva de `entityCode` con un
   * mapa fijo en el mapper (ver `infrastructure/mappers.ts`). */
  entityName: string | null;
  roleId: string;
  role: UserRole;
  status: StaffStatus;
  hireDate: string | null;
  /** Entitlement EFECTIVO y vigente (override si lo hay, si no el
   * calculado) — lo que consume el widget del dashboard. */
  vacationDaysPerYear: number | null;
  /** Override manual del admin. `null` = automático (calculado desde
   * `hireDate`). Es el valor con el que se precarga el input del
   * formulario: vacío cuando es `null` (automático). */
  vacationDaysOverride: number | null;
  /** Lo que daría el cálculo automático ahora mismo, exista o no un
   * override — para mostrar "Calculado automáticamente: X días" en el
   * formulario sin reimplementar la fórmula de negocio (deroga el "23
   * días/año" fijo del RF, ver backend `vacation_entitlement.py`). */
  vacationDaysCalculated: number;
  /** El backend NO manda `is_active` en la respuesta — se deriva de
   * `status === 'active'` en el mapper. */
  isActive: boolean;
}

/** Body de alta — el backend exige `entity`/`role` y no admite `isActive`
 * (una persona nueva siempre entra activa/invitada). */
export interface CreateStaffMemberInput {
  fullName: string;
  email: string;
  jobTitle?: string | null;
  /** Vacío/`undefined` = desconocido (colapsa a `null` en el DTO) — no hay
   * ambigüedad posible en el alta, igual que el resto de campos opcionales
   * de este input. */
  contractType?: ContractType | null;
  department?: string | null;
  entityCode: EntityCode;
  role: UserRole;
  hireDate?: string | null;
  /** Vacío/`null` = automático (calculado desde `hireDate`); un número =
   * override manual. */
  vacationDaysOverride?: number | null;
}

/** Body de edición — todo opcional; solo aquí existe `isActive`
 * (activar/suspender acceso). No admite `hireDate` (el backend no lo
 * expone en `PATCH /staff/{id}`).
 *
 * `vacationDaysOverride` AUSENTE (`undefined`) = no tocar el override;
 * `null` explícito = vaciarlo (vuelve a automático); un número = fijarlo.
 *
 * `contractType` sigue el mismo esquema de tres estados: AUSENTE
 * (`undefined`) = no tocar; `null` explícito = vaciarlo (vuelve a "sin
 * especificar"); un valor = fijarlo. */
export interface UpdateStaffMemberInput {
  jobTitle?: string | null;
  contractType?: ContractType | null;
  department?: string | null;
  entityCode?: EntityCode;
  role?: UserRole;
  vacationDaysOverride?: number | null;
  isActive?: boolean;
}

export interface StaffListParams {
  entityCode?: EntityCode;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** El backend NO devuelve `page`/`page_size` en la respuesta de lista
 * (solo se envían como query params de la request). */
export interface StaffListResult {
  members: StaffMember[];
  total: number;
}
