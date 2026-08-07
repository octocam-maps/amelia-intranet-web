import { API_BASE_URL, apiClient, ApiError } from '@/lib/http/api-client';
import { useStore } from '@/store';
import type {
  AddTimeClockEntryNoteInput,
  CompensationBalance,
  CreateTimeClockEntriesBatchInput,
  CreateTimeClockEntryInput,
  ListTimeClockEntriesParams,
  TechnicianDailyLog,
  TechnicianDailyLogInput,
  TechnicianMonthPage,
  TechnicianMonthParams,
  Project,
  TimeClockCurrentStatus,
  TimeClockEntriesBatchResult,
  TimeClockEntry,
  TimeClockEntryNote,
  TimeClockEntryPage,
  UpdateTimeClockEntryInput,
} from '../domain/models';
import type { TimeClockRepository } from '../domain/ports';
import type {
  CompensationBalanceDTO,
  TechnicianDailyLogDTO,
  TechnicianDailyLogListDTO,
  TimeClockCurrentStatusDTO,
  TimeClockEntriesBatchDTO,
  TimeClockEntryDTO,
  TimeClockEntryListDTO,
  TimeClockEntryNoteDTO,
  TimeClockEntryNoteListDTO,
} from './dtos';
import {
  batchResultFromDTO,
  compensationBalanceFromDTO,
  currentStatusFromDTO,
  entryFromDTO,
  noteFromDTO,
  technicianLogFromDTO,
  technicianMonthFromDTO,
} from './mappers';

function technicianMonthQuery(params: TechnicianMonthParams): string {
  const search = new URLSearchParams({
    year: String(params.year),
    month: String(params.month),
  });
  if (params.userId) search.set('user_id', params.userId);
  return `?${search.toString()}`;
}

/** El cuerpo que espera el backend. `workedMinutes` NO se envía nunca: lo
 * calcula el servidor y aceptarlo del cliente permitiría declarar 4 horas en
 * una jornada de 12 — es el dato del que cuelga toda la bolsa de 162 h. */
function technicianLogToBody(input: TechnicianDailyLogInput) {
  return {
    work_date: input.workDate,
    started_at: input.startedAt,
    ended_at: input.endedAt,
    project_id: input.projectId,
    work_location: input.workLocation,
    had_break: input.hadBreak,
    break_minutes: input.breakMinutes,
    overnight_stay: input.overnightStay,
    product_category: input.productCategory,
  };
}

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

  async createBatch(
    input: CreateTimeClockEntriesBatchInput
  ): Promise<TimeClockEntriesBatchResult> {
    const dto = await apiClient<TimeClockEntriesBatchDTO>('/time-clock/entries/batch', {
      method: 'POST',
      body: JSON.stringify({
        date_from: input.dateFrom,
        date_to: input.dateTo,
        clock_in_time: input.clockInTime,
        clock_out_time: input.clockOutTime ?? null,
      }),
    });
    return batchResultFromDTO(dto);
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

  // --- Parte diario del técnico (requerimiento v1.2 §M1) ---

  async listTechnicianLogs(params: TechnicianMonthParams): Promise<TechnicianMonthPage> {
    const dto = await apiClient<TechnicianDailyLogListDTO>(
      `/time-clock/technician-logs${technicianMonthQuery(params)}`,
    );
    return technicianMonthFromDTO(dto);
  },

  async createTechnicianLog(input: TechnicianDailyLogInput): Promise<TechnicianDailyLog> {
    const dto = await apiClient<TechnicianDailyLogDTO>('/time-clock/technician-logs', {
      method: 'POST',
      body: JSON.stringify(technicianLogToBody(input)),
    });
    return technicianLogFromDTO(dto);
  },

  async updateTechnicianLog(
    entryId: string,
    input: TechnicianDailyLogInput,
  ): Promise<TechnicianDailyLog> {
    const dto = await apiClient<TechnicianDailyLogDTO>(
      `/time-clock/technician-logs/${entryId}`,
      { method: 'PATCH', body: JSON.stringify(technicianLogToBody(input)) },
    );
    return technicianLogFromDTO(dto);
  },

  async removeTechnicianLog(entryId: string): Promise<void> {
    await apiClient<void>(`/time-clock/technician-logs/${entryId}`, { method: 'DELETE' });
  },

  async getCompensationBalance(year: number, userId?: string): Promise<CompensationBalance> {
    const search = new URLSearchParams({ year: String(year) });
    if (userId) search.set('user_id', userId);
    const dto = await apiClient<CompensationBalanceDTO>(
      `/time-clock/technician-logs/balance?${search.toString()}`,
    );
    return compensationBalanceFromDTO(dto);
  },

  async listProjects(): Promise<Project[]> {
    const dto = await apiClient<{ projects: Project[] }>('/time-clock/technician-logs/projects');
    // El DTO del backend ya usa `id`/`code`/`name` en camel-compatible: no hay
    // snake_case que traducir, así que no hace falta mapper.
    return dto.projects;
  },

  async exportTechnicianMonthXlsx(params: TechnicianMonthParams): Promise<Blob> {
    // Mismo motivo que `exportXlsx`: la respuesta es binaria, no JSON.
    const accessToken = useStore.getState().getAccessToken();
    const response = await fetch(
      `${API_BASE_URL}/time-clock/technician-logs/export.xlsx${technicianMonthQuery(params)}`,
      {
        credentials: 'include',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      },
    );
    if (!response.ok) {
      throw new ApiError('No se pudo generar el Excel del mes.', response.status);
    }
    return response.blob();
  },
};
