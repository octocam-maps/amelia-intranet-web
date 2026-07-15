import type { UserRole } from '@/features/auth/domain/models';
import { parseEnum } from '@/lib/parseEnum';
import type { EntityCode, StaffMember, StaffMemberInput, StaffStatus } from '../domain/models';
import type { StaffMemberDTO, StaffMemberInputDTO } from './dtos';

// Los tres se pintan como badge en StaffTable (`ENTITY_BADGE_VARIANT`,
// `STATUS_LABEL`/`STATUS_CLASS`) o en el desplegable de StaffForm
// (`ROLE_LABEL`) — un valor fuera de contrato deja el badge sin variant/texto.
const ENTITY_CODES: EntityCode[] = ['hub', 'lab', 'ops'];
const USER_ROLES: UserRole[] = ['administrador', 'empleado', 'externo_invitado'];
const STAFF_STATUSES: StaffStatus[] = ['activa', 'vacaciones', 'baja'];

export function staffMemberFromDTO(dto: StaffMemberDTO): StaffMember {
  return {
    id: dto.id,
    fullName: dto.full_name,
    email: dto.email,
    jobTitle: dto.job_title,
    department: dto.department,
    entityCode: parseEnum(dto.entity_code, ENTITY_CODES, 'hub'),
    entityName: dto.entity_name,
    role: parseEnum(dto.role, USER_ROLES, 'empleado'),
    status: parseEnum(dto.status, STAFF_STATUSES, 'activa'),
    avatarUrl: dto.avatar_url,
    hireDate: dto.hire_date,
    vacationDaysPerYear: dto.vacation_days_per_year,
    isActive: dto.is_active,
  };
}

export function staffMemberInputToDTO(input: StaffMemberInput): StaffMemberInputDTO {
  return {
    full_name: input.fullName,
    email: input.email,
    job_title: input.jobTitle,
    department: input.department ?? null,
    entity_code: input.entityCode,
    role: input.role,
    hire_date: input.hireDate ?? null,
    vacation_days_per_year: input.vacationDaysPerYear ?? null,
    is_active: input.isActive,
  };
}

export function partialStaffMemberInputToDTO(input: Partial<StaffMemberInput>): Partial<StaffMemberInputDTO> {
  const dto: Partial<StaffMemberInputDTO> = {};
  if (input.fullName !== undefined) dto.full_name = input.fullName;
  if (input.email !== undefined) dto.email = input.email;
  if (input.jobTitle !== undefined) dto.job_title = input.jobTitle;
  if (input.department !== undefined) dto.department = input.department;
  if (input.entityCode !== undefined) dto.entity_code = input.entityCode;
  if (input.role !== undefined) dto.role = input.role;
  if (input.hireDate !== undefined) dto.hire_date = input.hireDate;
  if (input.vacationDaysPerYear !== undefined) dto.vacation_days_per_year = input.vacationDaysPerYear;
  if (input.isActive !== undefined) dto.is_active = input.isActive;
  return dto;
}
