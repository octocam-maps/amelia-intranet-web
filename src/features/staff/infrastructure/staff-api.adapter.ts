import { apiClient } from '@/lib/http/api-client';
import type {
  CreateStaffMemberInput,
  StaffListParams,
  StaffListResult,
  StaffMember,
  UpdateStaffMemberInput,
} from '../domain/models';
import type { StaffRepository } from '../domain/ports';
import type { StaffListDTO, StaffMemberDTO } from './dtos';
import { createStaffMemberInputToDTO, staffMemberFromDTO, updateStaffMemberInputToDTO } from './mappers';

export const staffApiAdapter: StaffRepository = {
  async list(params: StaffListParams = {}): Promise<StaffListResult> {
    const search = new URLSearchParams();
    // Nombres de query param del backend: `entity` (no `entity_code`) y
    // `search` (no `q`) — ver routes.py `list_staff`.
    if (params.entityCode) search.set('entity', params.entityCode);
    if (params.search) search.set('search', params.search);
    if (params.page) search.set('page', String(params.page));
    if (params.pageSize) search.set('page_size', String(params.pageSize));
    const query = search.toString();
    const dto = await apiClient<StaffListDTO>(`/staff${query ? `?${query}` : ''}`);
    // El backend NO devuelve `page`/`page_size` en la respuesta.
    return {
      members: dto.members.map(staffMemberFromDTO),
      total: dto.total,
    };
  },

  async create(input: CreateStaffMemberInput): Promise<StaffMember> {
    const dto = await apiClient<StaffMemberDTO>('/staff', {
      method: 'POST',
      body: JSON.stringify(createStaffMemberInputToDTO(input)),
    });
    return staffMemberFromDTO(dto);
  },

  async update(id: string, input: UpdateStaffMemberInput): Promise<StaffMember> {
    const dto = await apiClient<StaffMemberDTO>(`/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updateStaffMemberInputToDTO(input)),
    });
    return staffMemberFromDTO(dto);
  },
};
