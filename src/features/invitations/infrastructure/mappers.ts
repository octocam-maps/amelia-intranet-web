import { USER_ROLES } from '@/features/auth/domain/models';
import { parseEnum, parseEnumNullable } from '@/lib/parseEnum';
import type { EntityCode, Invitation, InvitationStatus } from '../domain/models';
import type { InvitationDTO } from './dtos';

const ENTITY_CODES: EntityCode[] = ['hub', 'lab', 'ops'];
const INVITATION_STATUSES: InvitationStatus[] = ['pending', 'accepted', 'revoked', 'expired'];

export function invitationFromDTO(dto: InvitationDTO): Invitation {
  return {
    id: dto.id,
    email: dto.email,
    fullName: dto.full_name,
    role: parseEnum(dto.role_code, USER_ROLES, 'empleado'),
    entityCode: parseEnumNullable(dto.entity_code, ENTITY_CODES),
    invitedByName: dto.invited_by_name,
    status: parseEnum(dto.status, INVITATION_STATUSES, 'pending'),
    expiresAt: dto.expires_at,
    createdAt: dto.created_at,
  };
}
