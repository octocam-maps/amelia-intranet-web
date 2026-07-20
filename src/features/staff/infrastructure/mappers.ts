import { USER_ROLES } from '@/features/auth/domain/models';
import { parseEnum, parseEnumNullable } from '@/lib/parseEnum';
import type {
  CreateStaffMemberInput,
  EntityCode,
  StaffMember,
  StaffStatus,
  UpdateStaffMemberInput,
} from '../domain/models';
import type { CreateStaffMemberDTO, StaffMemberDTO, UpdateStaffMemberDTO } from './dtos';

// Los dos se pintan como badge en StaffTable (`ENTITY_BADGE_VARIANT`,
// `STATUS_LABEL`/`STATUS_CLASS`) — un valor fuera de contrato deja el badge
// sin variant/texto. El rol usa `USER_ROLES` (fuente única de
// `features/auth/domain/models.ts`) — antes duplicado aquí como
// `STAFF_ROLES`; si no incluyera `socio`, un `role_code: 'socio'` real caería
// al fallback `'empleado'` y un PATCH posterior sobre esa persona (aunque
// solo cambie el puesto) le quitaría el rol socio en silencio.
const ENTITY_CODES: EntityCode[] = ['hub', 'lab', 'ops'];
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
    vacationDaysOverride: dto.vacation_days_override,
    vacationDaysCalculated: dto.vacation_days_calculated,
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
    vacation_days_override: input.vacationDaysOverride ?? null,
  };
}

/** Body de `PATCH /staff/{id}` — todo opcional; solo incluye lo que cambió.
 * `vacationDaysOverride` se incluye tanto si es un número como si es
 * `null` explícito (vaciar) — SOLO se omite cuando es `undefined` (no
 * tocar). El backend distingue "ausente" de "null" con `model_fields_set`. */
export function updateStaffMemberInputToDTO(input: UpdateStaffMemberInput): UpdateStaffMemberDTO {
  const dto: UpdateStaffMemberDTO = {};
  if (input.jobTitle !== undefined) dto.job_title = input.jobTitle;
  if (input.department !== undefined) dto.department = input.department;
  if (input.entityCode !== undefined) dto.entity = input.entityCode;
  if (input.role !== undefined) dto.role = input.role;
  if (input.vacationDaysOverride !== undefined) dto.vacation_days_override = input.vacationDaysOverride;
  if (input.isActive !== undefined) dto.is_active = input.isActive;
  return dto;
}
