import { apiClient } from '@/lib/http/api-client';
import type { Holiday, HolidayInput, HolidayListParams } from '../domain/models';
import type { HolidaysRepository } from '../domain/ports';
import type { HolidayDTO, HolidayListDTO } from './dtos';
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
};
