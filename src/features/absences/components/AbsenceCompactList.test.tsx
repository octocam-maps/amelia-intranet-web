import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import { AbsenceCompactList } from './AbsenceCompactList';

const TYPES: AbsenceType[] = [
  {
    id: 'type-1',
    code: 'vacaciones',
    name: 'Vacaciones',
    isPaid: true,
    affectsBalance: true,
    color: '#00D170',
    requiresApproval: true,
    requiresJustification: false,
    maxDaysPerYear: null,
    isActive: true,
  },
];

function buildRequest(overrides: Partial<AbsenceRequest> = {}): AbsenceRequest {
  return {
    id: 'req-1',
    userId: 'user-1',
    absenceTypeId: 'type-1',
    startDate: '2026-08-03',
    endDate: '2026-08-03',
    daysCount: 1,
    reason: null,
    status: 'approved',
    reviewedBy: null,
    reviewNote: null,
    userFullName: null,
    ...overrides,
  };
}

describe('AbsenceCompactList', () => {
  it('usa el mensaje vacío por defecto cuando no hay solicitudes', () => {
    render(<AbsenceCompactList requests={[]} types={TYPES} />);

    expect(screen.getByText('Todavía no has solicitado ninguna ausencia.')).toBeInTheDocument();
  });

  it('acepta un `emptyMessage` propio (pestañas de "Mis solicitudes")', () => {
    render(<AbsenceCompactList requests={[]} types={TYPES} emptyMessage="No tienes solicitudes aprobadas." />);

    expect(screen.getByText('No tienes solicitudes aprobadas.')).toBeInTheDocument();
    expect(screen.queryByText('Todavía no has solicitado ninguna ausencia.')).not.toBeInTheDocument();
  });

  it('renderiza el nombre del tipo y el rango de fechas de cada solicitud', () => {
    render(<AbsenceCompactList requests={[buildRequest()]} types={TYPES} />);

    expect(screen.getByText('Vacaciones')).toBeInTheDocument();
    expect(screen.getByText(/3 ago · 1 día/)).toBeInTheDocument();
  });
});
