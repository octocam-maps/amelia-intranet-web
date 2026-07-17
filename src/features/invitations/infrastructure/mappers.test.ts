import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/features/auth/domain/models';
import { invitationFromDTO } from './mappers';
import type { InvitationDTO } from './dtos';

function baseDTO(overrides: Partial<InvitationDTO> = {}): InvitationDTO {
  return {
    id: 'inv-1',
    email: 'sandra@ameliahub.com',
    full_name: 'Sandra Ramírez',
    role_code: 'empleado',
    entity_code: 'hub',
    invited_by_name: 'Beatriz Luna',
    status: 'pending',
    expires_at: '2026-07-24T00:00:00Z',
    created_at: '2026-07-17T00:00:00Z',
    ...overrides,
  };
}

describe('invitationFromDTO', () => {
  it.each(USER_ROLES)('mapea el rol "%s" sin degradarlo (fuente única USER_ROLES)', (role) => {
    const invitation = invitationFromDTO(baseDTO({ role_code: role }));

    expect(invitation.role).toBe(role);
  });

  it('cae a "empleado" si el backend manda un role_code fuera de contrato', () => {
    const invitation = invitationFromDTO(baseDTO({ role_code: 'rol_que_no_existe' }));

    expect(invitation.role).toBe('empleado');
  });

  it('mapea entity_code null a null', () => {
    const invitation = invitationFromDTO(baseDTO({ entity_code: null }));

    expect(invitation.entityCode).toBeNull();
  });

  it('mapea el status literal', () => {
    const invitation = invitationFromDTO(baseDTO({ status: 'revoked' }));

    expect(invitation.status).toBe('revoked');
  });

  it('cae a "pending" si el backend manda un status fuera de contrato', () => {
    const invitation = invitationFromDTO(baseDTO({ status: 'algo_raro' }));

    expect(invitation.status).toBe('pending');
  });
});
