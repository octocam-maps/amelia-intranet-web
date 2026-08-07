import type { Department } from '../domain/models';
import type { DepartmentDTO } from './dtos';

export function departmentFromDTO(dto: DepartmentDTO): Department {
  return {
    id: dto.id,
    name: dto.name,
    entityId: dto.entity_id,
    entityCode: dto.entity_code,
    // `?? null` y no acceso directo: si el backend desplegado todavía es una
    // versión previa a la migración 054, estos campos no vienen en el JSON y
    // `undefined` rompería el `groupDepartments` con un grupo fantasma.
    parentDepartmentId: dto.parent_department_id ?? null,
    parentName: dto.parent_name ?? null,
  };
}
