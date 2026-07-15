import { apiClient } from '@/lib/http/api-client';
import type { TeamBirthday, TeamMember, TeamVacationEntry } from '../domain/models';
import type { TeamRepository } from '../domain/ports';
import type { TeamBirthdayListDTO, TeamMemberListDTO, TeamVacationEntryListDTO } from './dtos';
import { birthdayFromDTO, memberFromDTO, vacationEntryFromDTO } from './mappers';

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

  async listBirthdays(days = 7): Promise<TeamBirthday[]> {
    const dto = await apiClient<TeamBirthdayListDTO>(`/team/birthdays?days=${days}`);
    return dto.birthdays.map(birthdayFromDTO);
  },
};
