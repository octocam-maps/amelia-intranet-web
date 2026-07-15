import type { UserRole } from '@/features/auth/domain/models';
import { parseEnum } from '@/lib/parseEnum';
import type { UserProfile } from '../domain/models';
import type { UserProfileDTO } from './dtos';

// Se pinta como badge (`ROLE_LABEL`/`ROLE_BADGE_VARIANT` en ProfileHeader).
// Fallback deliberado al rol de menor privilegio: nunca 'administrador'.
const USER_ROLES: UserRole[] = ['administrador', 'empleado', 'externo_invitado'];

export function profileFromDTO(dto: UserProfileDTO): UserProfile {
  return {
    id: dto.id,
    email: dto.email,
    fullName: dto.full_name,
    avatarUrl: dto.avatar_url,
    role: parseEnum(dto.role, USER_ROLES, 'empleado'),
    jobTitle: dto.job_title,
    hireDate: dto.hire_date,
    entityName: dto.entity_name,
    departmentName: dto.department_name,
    managerName: dto.manager_name,
    isExternal: dto.is_external,
  };
}
