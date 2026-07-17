import { parseEnum, parseEnumNullable } from '@/lib/parseEnum';
import type { AbsenceKind, EntityCode, TeamAbsenceEntry, TeamBirthday, TeamMember } from '../domain/models';
import type { TeamAbsenceEntryDTO, TeamBirthdayDTO, TeamMemberDTO } from './dtos';

// Se pinta como badge en TeamDirectory (`ENTITY_BADGE_VARIANT[entityCode]`).
const ENTITY_CODES: EntityCode[] = ['hub', 'lab', 'ops'];

// Los únicos 3 valores privacy-safe que puede mandar el backend (ver
// domain/models.ts::AbsenceKind). Un valor inesperado colapsa a "ausente"
// — nunca se asume/expone un tipo real de ausencia sin reconocer.
const ABSENCE_KINDS: AbsenceKind[] = ['vacaciones', 'remoto', 'ausente'];

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

export function absenceEntryFromDTO(dto: TeamAbsenceEntryDTO): TeamAbsenceEntry {
  return {
    userId: dto.user_id,
    fullName: dto.full_name,
    startDate: dto.start_date,
    endDate: dto.end_date,
    kind: parseEnum(dto.kind, ABSENCE_KINDS, 'ausente'),
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
