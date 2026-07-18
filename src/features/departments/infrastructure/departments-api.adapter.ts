import { apiClient } from '@/lib/http/api-client';
import type { Department } from '../domain/models';
import type { DepartmentRepository } from '../domain/ports';
import type { DepartmentListDTO } from './dtos';
import { departmentFromDTO } from './mappers';

export const departmentsApiAdapter: DepartmentRepository = {
  async list(): Promise<Department[]> {
    const dto = await apiClient<DepartmentListDTO>('/departments');
    return dto.departments.map(departmentFromDTO);
  },
};
