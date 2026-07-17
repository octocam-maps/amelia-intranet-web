import { describe, expect, it } from 'vitest';
import { profileFromDTO, updateMyProfileInputToDTO } from './mappers';
import type { UserProfileDTO } from './dtos';

describe('profileFromDTO', () => {
  it('mapea a camelCase e incluye phone/city (Lote 2)', () => {
    const dto: UserProfileDTO = {
      id: 'user-1',
      email: 'sandra@ameliahub.com',
      full_name: 'Sandra Ramírez',
      avatar_url: null,
      role: 'empleado',
      job_title: 'Project Manager',
      hire_date: '2022-03-01',
      entity_name: 'Amelia Hub',
      department_name: 'Operaciones',
      manager_name: 'Beatriz Luna',
      is_external: false,
      phone: '+34 600 111 222',
      city: 'Madrid',
    };

    expect(profileFromDTO(dto)).toEqual({
      id: 'user-1',
      email: 'sandra@ameliahub.com',
      fullName: 'Sandra Ramírez',
      avatarUrl: null,
      role: 'empleado',
      jobTitle: 'Project Manager',
      hireDate: '2022-03-01',
      entityName: 'Amelia Hub',
      departmentName: 'Operaciones',
      managerName: 'Beatriz Luna',
      isExternal: false,
      phone: '+34 600 111 222',
      city: 'Madrid',
    });
  });

  it('cae a "empleado" si el backend manda un role fuera de contrato', () => {
    const dto: UserProfileDTO = {
      id: 'user-1',
      email: 'sandra@ameliahub.com',
      full_name: 'Sandra Ramírez',
      avatar_url: null,
      role: 'super_admin',
      job_title: null,
      hire_date: null,
      entity_name: null,
      department_name: null,
      manager_name: null,
      is_external: false,
      phone: null,
      city: null,
    };

    expect(profileFromDTO(dto).role).toBe('empleado');
  });
});

describe('updateMyProfileInputToDTO', () => {
  it('solo incluye los campos informados (PATCH parcial)', () => {
    expect(updateMyProfileInputToDTO({ city: 'Valencia' })).toEqual({ city: 'Valencia' });
    expect(updateMyProfileInputToDTO({ phone: '+34 600 000 000' })).toEqual({
      phone: '+34 600 000 000',
    });
    expect(updateMyProfileInputToDTO({})).toEqual({});
  });
});
