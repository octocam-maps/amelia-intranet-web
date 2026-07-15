import type { EntityCode, TeamMember, TeamVacationEntry } from '../domain/models';
import type { TeamMemberDTO, TeamVacationEntryDTO } from './dtos';

export function memberFromDTO(dto: TeamMemberDTO): TeamMember {
  return {
    id: dto.id,
    fullName: dto.full_name,
    jobTitle: dto.job_title,
    entityCode: dto.entity_code as EntityCode,
    entityName: dto.entity_name,
    phone: dto.phone,
    email: dto.email,
    avatarUrl: dto.avatar_url,
  };
}

export function vacationEntryFromDTO(dto: TeamVacationEntryDTO): TeamVacationEntry {
  return {
    userId: dto.user_id,
    fullName: dto.full_name,
    startDate: dto.start_date,
    endDate: dto.end_date,
  };
}
