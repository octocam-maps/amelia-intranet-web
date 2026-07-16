import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/features/auth/domain/models';
import { staffMemberFromDTO } from './mappers';
import type { StaffMemberDTO } from './dtos';

function baseDTO(overrides: Partial<StaffMemberDTO> = {}): StaffMemberDTO {
  return {
    id: 'user-1',
    full_name: 'David Ferre',
    email: 'david@ameliahub.com',
    avatar_url: null,
    job_title: 'Socio fundador',
    department_id: null,
    department_name: null,
    entity_id: null,
    entity_code: null,
    role_id: 'role-1',
    role_code: 'empleado',
    status: 'active',
    hire_date: null,
    vacation_days_per_year: null,
    ...overrides,
  };
}

describe('staffMemberFromDTO', () => {
  it.each(USER_ROLES)('mapea el rol "%s" sin degradarlo (fuente única USER_ROLES)', (role) => {
    const member = staffMemberFromDTO(baseDTO({ role_code: role }));

    expect(member.role).toBe(role);
  });

  it('cae a "empleado" si el backend manda un role_code fuera de contrato', () => {
    const member = staffMemberFromDTO(baseDTO({ role_code: 'rol_que_no_existe' }));

    expect(member.role).toBe('empleado');
  });
});
