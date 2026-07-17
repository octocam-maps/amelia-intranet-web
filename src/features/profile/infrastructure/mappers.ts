import { USER_ROLES } from '@/features/auth/domain/models';
import { parseEnum } from '@/lib/parseEnum';
import type { UpdateMyProfileInput, UserProfile } from '../domain/models';
import type { UpdateMyProfileDTO, UserProfileDTO } from './dtos';

export function profileFromDTO(dto: UserProfileDTO): UserProfile {
  return {
    id: dto.id,
    email: dto.email,
    fullName: dto.full_name,
    avatarUrl: dto.avatar_url,
    // Fallback deliberado al rol de menor privilegio: nunca 'administrador'.
    // `USER_ROLES` es la lista única (ver `features/auth/domain/models.ts`) —
    // antes duplicada aquí como `PROFILE_ROLES`.
    role: parseEnum(dto.role, USER_ROLES, 'empleado'),
    jobTitle: dto.job_title,
    hireDate: dto.hire_date,
    entityName: dto.entity_name,
    departmentName: dto.department_name,
    managerName: dto.manager_name,
    isExternal: dto.is_external,
    phone: dto.phone,
    city: dto.city,
  };
}

/** Body de `PATCH /profile/me` — todo opcional; solo incluye lo que cambió
 * (mismo criterio que `updateStaffMemberInputToDTO`). */
export function updateMyProfileInputToDTO(input: UpdateMyProfileInput): UpdateMyProfileDTO {
  const dto: UpdateMyProfileDTO = {};
  if (input.phone !== undefined) dto.phone = input.phone;
  if (input.city !== undefined) dto.city = input.city;
  return dto;
}
