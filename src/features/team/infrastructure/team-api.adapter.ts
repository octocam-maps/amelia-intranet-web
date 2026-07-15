import { apiClient } from '@/lib/http/api-client';
import type { TeamMember, TeamVacationEntry } from '../domain/models';
import type { TeamRepository } from '../domain/ports';
import type { TeamMemberListDTO, TeamVacationEntryListDTO } from './dtos';
import { memberFromDTO, vacationEntryFromDTO } from './mappers';

export const teamApiAdapter: TeamRepository = {
  async listDirectory(): Promise<TeamMember[]> {
    const dto = await apiClient<TeamMemberListDTO>('/team/directory');
    return dto.members.map(memberFromDTO);
  },

  async listVacationCalendar(month: string): Promise<TeamVacationEntry[]> {
    const dto = await apiClient<TeamVacationEntryListDTO>(
      `/team/vacation-calendar?month=${month}`
    );
    return dto.entries.map(vacationEntryFromDTO);
  },
};
