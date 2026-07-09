import { apiClient } from '@/lib/http/api-client';
import type { StaffListParams, StaffListResult, StaffMember, StaffMemberInput } from '../domain/models';
import type { StaffRepository } from '../domain/ports';
import type { StaffListDTO, StaffMemberDTO } from './dtos';
import { partialStaffMemberInputToDTO, staffMemberFromDTO, staffMemberInputToDTO } from './mappers';

export const staffApiAdapter: StaffRepository = {
  async list(params: StaffListParams = {}): Promise<StaffListResult> {
    const search = new URLSearchParams();
    if (params.entityCode) search.set('entity_code', params.entityCode);
    if (params.search) search.set('q', params.search);
    if (params.page) search.set('page', String(params.page));
    if (params.pageSize) search.set('page_size', String(params.pageSize));
    const query = search.toString();
    const dto = await apiClient<StaffListDTO>(`/staff${query ? `?${query}` : ''}`);
    return {
      members: dto.members.map(staffMemberFromDTO),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
    };
  },

  async create(input: StaffMemberInput): Promise<StaffMember> {
    const dto = await apiClient<StaffMemberDTO>('/staff', {
      method: 'POST',
      body: JSON.stringify(staffMemberInputToDTO(input)),
    });
    return staffMemberFromDTO(dto);
  },

  async update(id: string, input: Partial<StaffMemberInput>): Promise<StaffMember> {
    const dto = await apiClient<StaffMemberDTO>(`/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partialStaffMemberInputToDTO(input)),
    });
    return staffMemberFromDTO(dto);
  },
};
