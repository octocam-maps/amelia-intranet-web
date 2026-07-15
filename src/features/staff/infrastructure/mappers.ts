import type { UserRole } from '@/features/auth/domain/models';
import { parseEnum, parseEnumNullable } from '@/lib/parseEnum';
import type {
  CreateStaffMemberInput,
  EntityCode,
  StaffMember,
  StaffStatus,
  UpdateStaffMemberInput,
} from '../domain/models';
import type { CreateStaffMemberDTO, StaffMemberDTO, UpdateStaffMemberDTO } from './dtos';

// Los tres se pintan como badge en StaffTable (`ENTITY_BADGE_VARIANT`,
// `STATUS_LABEL`/`STATUS_CLASS`) o en el desplegable de StaffForm
// (`ROLE_LABEL`) — un valor fuera de contrato deja el badge sin variant/texto.
const ENTITY_CODES: EntityCode[] = ['hub', 'lab', 'ops'];
const USER_ROLES: UserRole[] = ['administrador', 'empleado', 'externo_invitado'];
const STAFF_STATUSES: StaffStatus[] = ['active', 'invited', 'suspended'];

/** El backend NO manda `entity_name` (solo `entity_code`) — se deriva aquí
 * con un mapa fijo. Si se necesita el nombre real de la entidad (p. ej. si
 * cambia el naming comercial), este es el único lugar a tocar. */
const ENTITY_NAME: Record<EntityCode, string> = {
  hub: 'Amelia Hub',
  lab: 'Amelia Lab',
  ops: 'Amelia Ops',
};

export function staffMemberFromDTO(dto: StaffMemberDTO): StaffMember {
  const entityCode = parseEnumNullable(dto.entity_code, ENTITY_CODES);
  const status = parseEnum(dto.status, STAFF_STATUSES, 'active');
  return {
    id: dto.id,
    fullName: dto.full_name,
    email: dto.email,
    avatarUrl: dto.avatar_url,
    jobTitle: dto.job_title,
    departmentId: dto.department_id,
    departmentName: dto.department_name,
    entityId: dto.entity_id,
    entityCode,
    entityName: entityCode ? ENTITY_NAME[entityCode] : null,
    roleId: dto.role_id,
    role: parseEnum(dto.role_code, USER_ROLES, 'empleado'),
    status,
    hireDate: dto.hire_date,
    vacationDaysPerYear: dto.vacation_days_per_year,
    isActive: status === 'active',
  };
}

/** Body de `POST /staff` — campos `entity`/`role` (código); sin `is_active`. */
export function createStaffMemberInputToDTO(input: CreateStaffMemberInput): CreateStaffMemberDTO {
  return {
    full_name: input.fullName,
    email: input.email,
    job_title: input.jobTitle ?? null,
    department: input.department ?? null,
    entity: input.entityCode,
    role: input.role,
    hire_date: input.hireDate ?? null,
    vacation_days_per_year: input.vacationDaysPerYear ?? null,
  };
}

/** Body de `PATCH /staff/{id}` — todo opcional; solo incluye lo que cambió. */
export function updateStaffMemberInputToDTO(input: UpdateStaffMemberInput): UpdateStaffMemberDTO {
  const dto: UpdateStaffMemberDTO = {};
  if (input.jobTitle !== undefined) dto.job_title = input.jobTitle;
  if (input.department !== undefined) dto.department = input.department;
  if (input.entityCode !== undefined) dto.entity = input.entityCode;
  if (input.role !== undefined) dto.role = input.role;
  if (input.vacationDaysPerYear !== undefined) dto.vacation_days_per_year = input.vacationDaysPerYear;
  if (input.isActive !== undefined) dto.is_active = input.isActive;
  return dto;
}
