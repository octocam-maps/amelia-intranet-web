import type { Department } from '../domain/models';
import type { DepartmentDTO } from './dtos';

export function departmentFromDTO(dto: DepartmentDTO): Department {
  return {
    id: dto.id,
    name: dto.name,
    entityId: dto.entity_id,
    entityCode: dto.entity_code,
  };
}
