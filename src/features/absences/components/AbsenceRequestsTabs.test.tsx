import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import { AbsenceRequestsTabs } from './AbsenceRequestsTabs';

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
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    daysCount: 5,
    reason: null,
    status: 'approved',
    reviewedBy: null,
    reviewNote: null,
    userFullName: null,
    ...overrides,
  };
}

// "Hoy" fijo (mismo criterio que absenceRequestTabs.test.ts) para que la
// categorización aprobada/pendiente/pasada no dependa de cuándo corre el test.
describe('AbsenceRequestsTabs — "Mis solicitudes"', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 28)); // 28 de julio de 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra la pestaña "Aprobadas" seleccionada por defecto', () => {
    render(<AbsenceRequestsTabs requests={[buildRequest({ id: 'r1' })]} types={TYPES} />);

    expect(screen.getByRole('tab', { name: 'Aprobadas', selected: true })).toBeInTheDocument();
    expect(screen.getByText('Vacaciones')).toBeInTheDocument();
  });

  it('cambia a "Pendientes" y muestra su vacío propio cuando no hay ninguna', () => {
    render(<AbsenceRequestsTabs requests={[buildRequest({ id: 'r1' })]} types={TYPES} />);

    // Radix activa la pestaña en `onMouseDown` (ver `TabsTrigger`), no en
    // `click` — `fireEvent.click` por sí solo no dispara el cambio de pestaña.
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Pendientes' }));

    expect(screen.getByText('No tienes solicitudes pendientes.')).toBeInTheDocument();
  });

  it('cambia a "Pasadas" y muestra una solicitud ya finalizada', () => {
    const past = buildRequest({ id: 'r2', startDate: '2026-06-01', endDate: '2026-06-05' });
    render(<AbsenceRequestsTabs requests={[past]} types={TYPES} />);

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Pasadas' }));

    expect(screen.getByText('Vacaciones')).toBeInTheDocument();
  });

  it('muestra el vacío propio de "Aprobadas" cuando no hay ninguna', () => {
    render(<AbsenceRequestsTabs requests={[]} types={TYPES} />);

    expect(screen.getByText('No tienes solicitudes aprobadas.')).toBeInTheDocument();
  });
});
