import { apiClient, ApiError } from '@/lib/http/api-client';
import { useStore } from '@/store';
import type {
  AbsenceBalance,
  AbsenceCalendarEntry,
  AbsenceCalendarRangeParams,
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
  AbsenceCalendarEntryListDTO,
  AbsenceRequestDTO,
  AbsenceRequestListDTO,
  AbsenceTypeDTO,
  AbsenceTypeListDTO,
} from './dtos';
import {
  absenceTypeInputToDTO,
  balanceFromDTO,
  calendarEntryFromDTO,
  partialAbsenceTypeInputToDTO,
  requestFromDTO,
  typeFromDTO,
} from './mappers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function calendarQuery(params: AbsenceCalendarRangeParams): string {
  const search = new URLSearchParams({ date_from: params.dateFrom, date_to: params.dateTo });
  return `?${search.toString()}`;
}

export const absencesApiAdapter: AbsencesRepository = {
  async listTypes(): Promise<AbsenceType[]> {
    const dto = await apiClient<AbsenceTypeListDTO>('/absences/types');
    return dto.types.map(typeFromDTO);
  },

  // Vista de gestión del admin: incluye los tipos DESACTIVADOS (is_active
  // false), a diferencia de `listTypes` (solo activos, para el modal de
  // solicitud). Sin esto, al desactivar un tipo desaparecía de la grid.
  async listAllTypes(): Promise<AbsenceType[]> {
    const dto = await apiClient<AbsenceTypeListDTO>('/absences/types/admin');
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

  async listCalendar(params: AbsenceCalendarRangeParams): Promise<AbsenceCalendarEntry[]> {
    const dto = await apiClient<AbsenceCalendarEntryListDTO>(
      `/absences/calendar/all${calendarQuery(params)}`
    );
    return dto.entries.map(calendarEntryFromDTO);
  },

  async exportCalendarXlsx(params: AbsenceCalendarRangeParams): Promise<Blob> {
    // No usa `apiClient`: la respuesta es un binario (xlsx), no JSON —
    // mismo motivo que `time-clock/infrastructure/time-clock-api.adapter.ts::exportXlsx`.
    const accessToken = useStore.getState().getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/absences/calendar/export.xlsx${calendarQuery(params)}`,
      {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      }
    );
    if (!response.ok) {
      throw new ApiError('No se pudo generar el Excel del calendario.', response.status);
    }
    return response.blob();
  },

  async exportCalendarPdf(params: AbsenceCalendarRangeParams): Promise<Blob> {
    const accessToken = useStore.getState().getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/absences/calendar/export.pdf${calendarQuery(params)}`,
      {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      }
    );
    if (!response.ok) {
      throw new ApiError('No se pudo generar el PDF del calendario.', response.status);
    }
    return response.blob();
  },
};
