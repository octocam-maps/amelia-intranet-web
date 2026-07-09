import { apiClient } from '@/lib/http/api-client';
import type {
  Holiday,
  HolidayImportResult,
  HolidayInput,
  HolidayListParams,
} from '../domain/models';
import type { HolidaysRepository } from '../domain/ports';
import type { HolidayDTO, HolidayImportResultDTO, HolidayListDTO } from './dtos';
import { holidayFromDTO, holidayInputToDTO, partialHolidayInputToDTO } from './mappers';

export const holidaysApiAdapter: HolidaysRepository = {
  async list(params: HolidayListParams = {}): Promise<Holiday[]> {
    const search = new URLSearchParams();
    if (params.year) search.set('year', String(params.year));
    const query = search.toString();
    const dto = await apiClient<HolidayListDTO>(`/holidays${query ? `?${query}` : ''}`);
    return dto.holidays.map(holidayFromDTO);
  },

  async create(input: HolidayInput): Promise<Holiday> {
    const dto = await apiClient<HolidayDTO>('/holidays', {
      method: 'POST',
      body: JSON.stringify(holidayInputToDTO(input)),
    });
    return holidayFromDTO(dto);
  },

  async update(id: string, input: Partial<HolidayInput>): Promise<Holiday> {
    const dto = await apiClient<HolidayDTO>(`/holidays/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partialHolidayInputToDTO(input)),
    });
    return holidayFromDTO(dto);
  },

  async remove(id: string): Promise<void> {
    await apiClient<void>(`/holidays/${id}`, { method: 'DELETE' });
  },

  // Importa los festivos oficiales (nacional España + autonómico Cataluña)
  // del año desde la API oficial. No pisa los festivos añadidos a mano.
  async importOfficial(year: number): Promise<HolidayImportResult> {
    const dto = await apiClient<HolidayImportResultDTO>(`/holidays/import?year=${year}`, {
      method: 'POST',
    });
    return {
      year: dto.year,
      imported: dto.imported,
      updated: dto.updated,
      skipped: dto.skipped,
    };
  },
};
