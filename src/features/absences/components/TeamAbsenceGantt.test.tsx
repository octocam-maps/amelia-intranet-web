import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import { TeamAbsenceGantt } from './TeamAbsenceGantt';

function buildType(overrides: Partial<AbsenceType> = {}): AbsenceType {
  return {
    id: 'type-1',
    code: 'paternidad',
    name: 'Paternidad',
    isPaid: true,
    affectsBalance: false,
    color: '#1E3A8A',
    requiresApproval: true,
    requiresJustification: false,
    maxDaysPerYear: null,
    isActive: true,
    ...overrides,
  };
}

function buildRequest(overrides: Partial<AbsenceRequest> = {}): AbsenceRequest {
  return {
    id: 'req-1',
    userId: 'user-1',
    absenceTypeId: 'type-1',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    daysCount: 3,
    reason: null,
    status: 'approved',
    reviewedBy: null,
    reviewNote: null,
    userFullName: 'Sandra Ramírez',
    ...overrides,
  };
}

// RF-A5.7 (WCAG 1.4.1): el Gantt de la plantilla (vista admin) tenía el
// mismo problema que el calendario general — barra solo con color.
describe('TeamAbsenceGantt — segundo canal de distinción (RF-A5.7)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra la abreviatura del tipo dentro de la barra, no solo el color', () => {
    const type = buildType();
    const request = buildRequest();

    render(<TeamAbsenceGantt requests={[request]} types={[type]} />);

    expect(screen.getByText('PA')).toBeInTheDocument();
  });

  // A11Y-2: `#F59F0A` (ámbar de "Vacaciones") solo tiene 2.13:1 de
  // contraste con texto blanco fijo — muy por debajo del mínimo AA de
  // 4.5:1. Con negro da 9.85:1.
  it('usa texto negro sobre un color de fondo claro que no cumple contraste con blanco', () => {
    const type = buildType({ id: 'type-vac', code: 'vacaciones', name: 'Vacaciones', color: '#F59F0A' });
    const request = buildRequest({ absenceTypeId: 'type-vac' });

    render(<TeamAbsenceGantt requests={[request]} types={[type]} />);

    expect(screen.getByText('VA')).toHaveStyle({ color: '#000000' });
  });
});
