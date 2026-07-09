import { apiClient } from '@/lib/http/api-client';
import type { TeamMember, TeamVacationEntry } from '../domain/models';
import type { TeamRepository } from '../domain/ports';
import type { TeamMemberDTO, TeamVacationEntryDTO } from './dtos';
import { memberFromDTO, vacationEntryFromDTO } from './mappers';

export const teamApiAdapter: TeamRepository = {
  async listDirectory(): Promise<TeamMember[]> {
    const dto = await apiClient<TeamMemberDTO[]>('/team/directory');
    return dto.map(memberFromDTO);
  },

  async listVacationCalendar(month: string): Promise<TeamVacationEntry[]> {
    const dto = await apiClient<TeamVacationEntryDTO[]>(
      `/team/vacation-calendar?month=${month}`
    );
    return dto.map(vacationEntryFromDTO);
  },
};
