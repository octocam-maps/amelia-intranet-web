import { apiClient } from '@/lib/http/api-client';
import type { Role } from '../domain/models';
import type { RoleRepository } from '../domain/ports';
import type { RoleListDTO } from './dtos';
import { roleFromDTO } from './mappers';

export const rolesApiAdapter: RoleRepository = {
  async list(): Promise<Role[]> {
    const dto = await apiClient<RoleListDTO>('/roles');
    return dto.roles.map(roleFromDTO);
  },
};
