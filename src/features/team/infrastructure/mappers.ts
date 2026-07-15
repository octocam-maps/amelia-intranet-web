import { parseEnumNullable } from '@/lib/parseEnum';
import type { EntityCode, TeamBirthday, TeamMember, TeamVacationEntry } from '../domain/models';
import type { TeamBirthdayDTO, TeamMemberDTO, TeamVacationEntryDTO } from './dtos';

// Se pinta como badge en TeamDirectory (`ENTITY_BADGE_VARIANT[entityCode]`).
const ENTITY_CODES: EntityCode[] = ['hub', 'lab', 'ops'];

export function memberFromDTO(dto: TeamMemberDTO): TeamMember {
  return {
    id: dto.id,
    fullName: dto.full_name,
    jobTitle: dto.job_title,
    entityCode: parseEnumNullable(dto.entity_code, ENTITY_CODES),
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

export function birthdayFromDTO(dto: TeamBirthdayDTO): TeamBirthday {
  return {
    userId: dto.user_id,
    fullName: dto.full_name,
    avatarUrl: dto.avatar_url,
    day: dto.day,
    month: dto.month,
    isToday: dto.is_today,
  };
}
