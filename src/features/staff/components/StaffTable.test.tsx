import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Invitation } from '@/features/invitations/domain/models';
import { StaffTable } from './StaffTable';
import type { StaffMember } from '../domain/models';

function buildMember(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: 'user-1',
    fullName: 'Sandra Ramírez',
    email: 'sandra@ameliahub.com',
    avatarUrl: null,
    jobTitle: 'Project Manager',
    departmentId: null,
    departmentName: null,
    entityId: 'entity-hub',
    entityCode: 'hub',
    entityName: 'Amelia Hub',
    roleId: 'role-1',
    role: 'empleado',
    status: 'invited',
    hireDate: null,
    vacationDaysPerYear: null,
    isActive: false,
    ...overrides,
  };
}

function buildInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: 'inv-1',
    email: 'sandra@ameliahub.com',
    fullName: 'Sandra Ramírez',
    role: 'empleado',
    entityCode: 'hub',
    invitedByName: 'Beatriz Luna',
    status: 'pending',
    expiresAt: '2026-07-24T00:00:00Z',
    createdAt: '2026-07-17T00:00:00Z',
    ...overrides,
  };
}

const noop = vi.fn();

describe('StaffTable', () => {
  it('muestra el badge "Invitación pendiente" cuando hay invitación asociada a un status "invited"', () => {
    const member = buildMember({ status: 'invited' });
    const invitation = buildInvitation();

    render(
      <StaffTable
        members={[member]}
        isLoading={false}
        onEdit={noop}
        onToggleActive={noop}
        pendingInvitationByEmail={new Map([[invitation.email, invitation]])}
        onResendInvitation={noop}
        onCancelInvitation={noop}
      />
    );

    expect(screen.getByText('Invitación pendiente')).toBeInTheDocument();
  });

  it('NO muestra el badge para alguien activo, aunque hubiera quedado una invitación vieja en el mapa', () => {
    const member = buildMember({ status: 'active', isActive: true });
    const invitation = buildInvitation();

    render(
      <StaffTable
        members={[member]}
        isLoading={false}
        onEdit={noop}
        onToggleActive={noop}
        pendingInvitationByEmail={new Map([[invitation.email, invitation]])}
        onResendInvitation={noop}
        onCancelInvitation={noop}
      />
    );

    expect(screen.queryByText('Invitación pendiente')).not.toBeInTheDocument();
  });

  it('NO muestra el badge para un "invited" sin invitación asociada (altas anteriores a este feature)', () => {
    const member = buildMember({ status: 'invited' });

    render(
      <StaffTable
        members={[member]}
        isLoading={false}
        onEdit={noop}
        onToggleActive={noop}
        pendingInvitationByEmail={new Map()}
        onResendInvitation={noop}
        onCancelInvitation={noop}
      />
    );

    expect(screen.queryByText('Invitación pendiente')).not.toBeInTheDocument();
  });

  it('empareja la invitación por email sin distinguir mayúsculas/minúsculas', () => {
    const member = buildMember({ status: 'invited', email: 'Sandra@AmeliaHub.com' });
    const invitation = buildInvitation({ email: 'sandra@ameliahub.com' });

    render(
      <StaffTable
        members={[member]}
        isLoading={false}
        onEdit={noop}
        onToggleActive={noop}
        pendingInvitationByEmail={new Map([[invitation.email, invitation]])}
        onResendInvitation={noop}
        onCancelInvitation={noop}
      />
    );

    expect(screen.getByText('Invitación pendiente')).toBeInTheDocument();
  });
});
