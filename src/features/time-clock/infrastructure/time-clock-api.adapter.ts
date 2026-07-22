import { API_BASE_URL, apiClient, ApiError } from '@/lib/http/api-client';
import { useStore } from '@/store';
import type {
  AddTimeClockEntryNoteInput,
  CreateTimeClockEntryInput,
  ListTimeClockEntriesParams,
  TimeClockCurrentStatus,
  TimeClockEntry,
  TimeClockEntryNote,
  TimeClockEntryPage,
  UpdateTimeClockEntryInput,
} from '../domain/models';
import type { TimeClockRepository } from '../domain/ports';
import type {
  TimeClockCurrentStatusDTO,
  TimeClockEntryDTO,
  TimeClockEntryListDTO,
  TimeClockEntryNoteDTO,
  TimeClockEntryNoteListDTO,
} from './dtos';
import { currentStatusFromDTO, entryFromDTO, noteFromDTO } from './mappers';

function buildQuery(params: ListTimeClockEntriesParams): string {
  const search = new URLSearchParams();
  // `userIds` (multi-selector) gana sobre `userId` si llegan los dos —
  // mismo criterio que el use case del backend.
  if (params.userIds && params.userIds.length > 0) {
    search.set('user_ids', params.userIds.join(','));
  } else if (params.userId) {
    search.set('user_id', params.userId);
  }
  if (params.dateFrom) search.set('date_from', params.dateFrom);
  if (params.dateTo) search.set('date_to', params.dateTo);
  // `limit`/`offset` no aplican al export CSV — ese endpoint siempre exporta
  // el rango completo, así que `exportCsv` reutiliza esta misma función sin
  // pasarlos nunca en `params`.
  if (params.limit !== undefined) search.set('limit', String(params.limit));
  if (params.offset !== undefined) search.set('offset', String(params.offset));
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

  async list(params: ListTimeClockEntriesParams): Promise<TimeClockEntryPage> {
    const dto = await apiClient<TimeClockEntryListDTO>(
      `/time-clock/entries${buildQuery(params)}`
    );
    return {
      entries: dto.entries.map(entryFromDTO),
      total: dto.total,
      limit: dto.limit,
      offset: dto.offset,
    };
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

  async listNotes(entryId: string): Promise<TimeClockEntryNote[]> {
    const dto = await apiClient<TimeClockEntryNoteListDTO>(
      `/time-clock/entries/${entryId}/notes`
    );
    return dto.notes.map(noteFromDTO);
  },

  async addNote(entryId: string, input: AddTimeClockEntryNoteInput): Promise<TimeClockEntryNote> {
    const dto = await apiClient<TimeClockEntryNoteDTO>(`/time-clock/entries/${entryId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ body: input.body }),
    });
    return noteFromDTO(dto);
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

  async exportXlsx(): Promise<Blob> {
    // Mismo motivo que `exportCsv`: la respuesta es un binario (xlsx), no
    // JSON, así que no puede pasar por `apiClient`.
    const accessToken = useStore.getState().getAccessToken();
    const response = await fetch(`${API_BASE_URL}/time-clock/entries/export.xlsx`, {
      credentials: 'include',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    if (!response.ok) {
      throw new ApiError('No se pudo generar el Excel de fichajes.', response.status);
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
