import { apiClient } from '@/lib/http/api-client';
import type {
  AbsenceBalance,
  AbsenceRequest,
  AbsenceType,
  AbsenceTypeInput,
  CreateAbsenceRequestInput,
  ListAbsenceRequestsMode,
  ReviewAbsenceRequestInput,
} from '../domain/models';
import type { AbsencesRepository } from '../domain/ports';
import type {
  AbsenceBalanceListDTO,
  AbsenceRequestDTO,
  AbsenceRequestListDTO,
  AbsenceTypeDTO,
  AbsenceTypeListDTO,
} from './dtos';
import {
  absenceTypeInputToDTO,
  balanceFromDTO,
  partialAbsenceTypeInputToDTO,
  requestFromDTO,
  typeFromDTO,
} from './mappers';

export const absencesApiAdapter: AbsencesRepository = {
  async listTypes(): Promise<AbsenceType[]> {
    const dto = await apiClient<AbsenceTypeListDTO>('/absences/types');
    return dto.types.map(typeFromDTO);
  },

  async createType(input: AbsenceTypeInput): Promise<AbsenceType> {
    const dto = await apiClient<AbsenceTypeDTO>('/absences/types', {
      method: 'POST',
      body: JSON.stringify(absenceTypeInputToDTO(input)),
    });
    return typeFromDTO(dto);
  },

  async updateType(id: string, input: Partial<AbsenceTypeInput>): Promise<AbsenceType> {
    const dto = await apiClient<AbsenceTypeDTO>(`/absences/types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partialAbsenceTypeInputToDTO(input)),
    });
    return typeFromDTO(dto);
  },

  async getBalance(params = {}): Promise<AbsenceBalance[]> {
    const search = new URLSearchParams();
    if (params.userId) search.set('user_id', params.userId);
    if (params.year) search.set('year', String(params.year));
    const query = search.toString();
    const dto = await apiClient<AbsenceBalanceListDTO>(
      `/absences/balance${query ? `?${query}` : ''}`
    );
    return dto.balances.map(balanceFromDTO);
  },

  async createRequest(input: CreateAbsenceRequestInput): Promise<AbsenceRequest> {
    const dto = await apiClient<AbsenceRequestDTO>('/absences/requests', {
      method: 'POST',
      body: JSON.stringify({
        absence_type_id: input.absenceTypeId,
        start_date: input.startDate,
        end_date: input.endDate,
        reason: input.reason ?? null,
      }),
    });
    return requestFromDTO(dto);
  },

  async listRequests(params = {}): Promise<AbsenceRequest[]> {
    const mode: ListAbsenceRequestsMode = params.mode ?? 'own';
    const endpoint =
      mode === 'pending'
        ? '/absences/requests/pending'
        : mode === 'all'
          ? '/absences/requests/all'
          : `/absences/requests${params.userId ? `?user_id=${params.userId}` : ''}`;
    const dto = await apiClient<AbsenceRequestListDTO>(endpoint);
    return dto.requests.map(requestFromDTO);
  },

  async reviewRequest(
    requestId: string,
    input: ReviewAbsenceRequestInput
  ): Promise<AbsenceRequest> {
    const dto = await apiClient<AbsenceRequestDTO>(`/absences/requests/${requestId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision: input.decision, note: input.note ?? null }),
    });
    return requestFromDTO(dto);
  },
};
