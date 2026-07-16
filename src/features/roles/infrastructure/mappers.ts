import type { Role } from '../domain/models';
import type { RoleDTO } from './dtos';

export function roleFromDTO(dto: RoleDTO): Role {
  return { code: dto.code, name: dto.name };
}
