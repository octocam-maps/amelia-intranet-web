import { apiClient } from '@/lib/http/api-client';
import type { TeamAbsenceEntry, TeamBirthday, TeamMember } from '../domain/models';
import type { TeamRepository } from '../domain/ports';
import type { TeamAbsenceEntryListDTO, TeamBirthdayListDTO, TeamMemberListDTO } from './dtos';
import { absenceEntryFromDTO, birthdayFromDTO, memberFromDTO } from './mappers';

export const teamApiAdapter: TeamRepository = {
  async listDirectory(): Promise<TeamMember[]> {
    const dto = await apiClient<TeamMemberListDTO>('/team/directory');
    return dto.members.map(memberFromDTO);
  },

  async listTeamCalendar(month: string): Promise<TeamAbsenceEntry[]> {
    // El backend resuelve el alcance (departamento del usuario autenticado)
    // a partir del token — este endpoint no acepta ni necesita un
    // `department_id`/`user_id` en la query.
    const dto = await apiClient<TeamAbsenceEntryListDTO>(
      `/team/vacation-calendar?month=${month}`
    );
    return dto.entries.map(absenceEntryFromDTO);
  },

  async listBirthdays(days = 7): Promise<TeamBirthday[]> {
    const dto = await apiClient<TeamBirthdayListDTO>(`/team/birthdays?days=${days}`);
    return dto.birthdays.map(birthdayFromDTO);
  },
};
