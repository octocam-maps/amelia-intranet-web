import { apiClient } from '@/lib/http/api-client';
import type { Announcement, AnnouncementInput } from '../domain/models';
import type { AnnouncementsRepository } from '../domain/ports';
import type { AnnouncementDTO, AnnouncementListDTO } from './dtos';
import { announcementFromDTO, announcementInputToDTO, partialAnnouncementInputToDTO } from './mappers';

export const announcementsApiAdapter: AnnouncementsRepository = {
  async list(): Promise<Announcement[]> {
    const dto = await apiClient<AnnouncementListDTO>('/announcements');
    return dto.announcements.map(announcementFromDTO);
  },

  async create(input: AnnouncementInput): Promise<Announcement> {
    const dto = await apiClient<AnnouncementDTO>('/announcements', {
      method: 'POST',
      body: JSON.stringify(announcementInputToDTO(input)),
    });
    return announcementFromDTO(dto);
  },

  async update(id: string, input: Partial<AnnouncementInput>): Promise<Announcement> {
    const dto = await apiClient<AnnouncementDTO>(`/announcements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partialAnnouncementInputToDTO(input)),
    });
    return announcementFromDTO(dto);
  },

  async remove(id: string): Promise<void> {
    await apiClient<void>(`/announcements/${id}`, { method: 'DELETE' });
  },
};
