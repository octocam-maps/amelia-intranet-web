import type { UserRole } from '@/features/auth/domain/models';

export type EntityCode = 'hub' | 'lab' | 'ops';

/** Estado real de `users.status` (backend) — NO "activa/vacaciones/baja". */
export type StaffStatus = 'active' | 'invited' | 'suspended';

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string | null;
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
  vacationDaysPerYear: number | null;
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
  department?: string | null;
  entityCode: EntityCode;
  role: UserRole;
  hireDate?: string | null;
  vacationDaysPerYear?: number | null;
}

/** Body de edición — todo opcional; solo aquí existe `isActive`
 * (activar/suspender acceso). No admite `hireDate` (el backend no lo
 * expone en `PATCH /staff/{id}`). */
export interface UpdateStaffMemberInput {
  jobTitle?: string | null;
  department?: string | null;
  entityCode?: EntityCode;
  role?: UserRole;
  vacationDaysPerYear?: number | null;
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
