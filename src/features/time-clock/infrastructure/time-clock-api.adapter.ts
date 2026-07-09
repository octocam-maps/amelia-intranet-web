import { apiClient, ApiError } from '@/lib/http/api-client';
import { useStore } from '@/store';
import type {
  CreateTimeClockEntryInput,
  ListTimeClockEntriesParams,
  TimeClockCurrentStatus,
  TimeClockEntry,
  UpdateTimeClockEntryInput,
} from '../domain/models';
import type { TimeClockRepository } from '../domain/ports';
import type { TimeClockCurrentStatusDTO, TimeClockEntryDTO, TimeClockEntryListDTO } from './dtos';
import { currentStatusFromDTO, entryFromDTO } from './mappers';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function buildQuery(params: ListTimeClockEntriesParams): string {
  const search = new URLSearchParams();
  if (params.userId) search.set('user_id', params.userId);
  if (params.dateFrom) search.set('date_from', params.dateFrom);
  if (params.dateTo) search.set('date_to', params.dateTo);
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const timeClockApiAdapter: TimeClockRepository = {
  async create(input: CreateTimeClockEntryInput): Promise<TimeClockEntry> {
    const dto = await apiClient<TimeClockEntryDTO>('/time-clock/entries', {
      method: 'POST',
      body: JSON.stringify({
        work_date: input.workDate,
        clock_in: input.clockIn,
        clock_out: input.clockOut ?? null,
      }),
    });
    return entryFromDTO(dto);
  },

  async list(params: ListTimeClockEntriesParams): Promise<TimeClockEntry[]> {
    const dto = await apiClient<TimeClockEntryListDTO>(
      `/time-clock/entries${buildQuery(params)}`
    );
    return dto.entries.map(entryFromDTO);
  },

  async update(entryId: string, input: UpdateTimeClockEntryInput): Promise<TimeClockEntry> {
    const dto = await apiClient<TimeClockEntryDTO>(`/time-clock/entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify({ clock_in: input.clockIn, clock_out: input.clockOut ?? null }),
    });
    return entryFromDTO(dto);
  },

  async remove(entryId: string): Promise<void> {
    await apiClient<null>(`/time-clock/entries/${entryId}`, { method: 'DELETE' });
  },

  async exportCsv(params: ListTimeClockEntriesParams): Promise<Blob> {
    // No usa `apiClient`: la respuesta es `text/csv`, no JSON, y `apiClient`
    // asume siempre `response.json()`.
    const accessToken = useStore.getState().getAccessToken();
    const response = await fetch(`${API_BASE_URL}/time-clock/entries/export${buildQuery(params)}`, {
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    if (!response.ok) {
      throw new ApiError('No se pudo exportar el fichaje.', response.status);
    }
    return response.blob();
  },

  async getCurrent(): Promise<TimeClockCurrentStatus> {
    const dto = await apiClient<TimeClockCurrentStatusDTO>('/time-clock/current');
    return currentStatusFromDTO(dto);
  },

  async clockIn(): Promise<TimeClockCurrentStatus> {
    const dto = await apiClient<TimeClockCurrentStatusDTO>('/time-clock/clock-in', {
      method: 'POST',
    });
    return currentStatusFromDTO(dto);
  },

  async clockOut(): Promise<TimeClockCurrentStatus> {
    const dto = await apiClient<TimeClockCurrentStatusDTO>('/time-clock/clock-out', {
      method: 'POST',
    });
    return currentStatusFromDTO(dto);
  },

  async startBreak(): Promise<TimeClockCurrentStatus> {
    const dto = await apiClient<TimeClockCurrentStatusDTO>('/time-clock/breaks/start', {
      method: 'POST',
    });
    return currentStatusFromDTO(dto);
  },

  async endBreak(): Promise<TimeClockCurrentStatus> {
    const dto = await apiClient<TimeClockCurrentStatusDTO>('/time-clock/breaks/end', {
      method: 'POST',
    });
    return currentStatusFromDTO(dto);
  },
};
