import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import { AbsenceMonthCalendar } from './AbsenceMonthCalendar';

vi.mock('@/features/holidays/application/useHolidays', () => ({
  useHolidays: () => ({ data: [] }),
}));

function buildType(overrides: Partial<AbsenceType> = {}): AbsenceType {
  return {
    id: 'type-1',
    code: 'permiso_matrimonio',
    name: 'Permiso Matrimonio',
    isPaid: true,
    affectsBalance: false,
    color: '#F9A8D4',
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
    startDate: '2026-07-15',
    endDate: '2026-07-15',
    daysCount: 1,
    reason: null,
    status: 'approved',
    reviewedBy: null,
    reviewNote: null,
    userFullName: null,
    ...overrides,
  };
}

function renderCalendar(requests: AbsenceRequest[], types: AbsenceType[]) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AbsenceMonthCalendar requests={requests} types={types} />
    </QueryClientProvider>
  );
}

// RF-A5.7 (WCAG 1.4.1): con 10 tipos de ausencia posibles, dos chips del
// mismo color aproximado deben seguir siendo distinguibles sin depender del
// color — de ahí la abreviatura visible en la celda, no solo en el `title`
// (que solo aparece al hacer hover, no de un vistazo).
describe('AbsenceMonthCalendar — segundo canal de distinción (RF-A5.7)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 15)); // 15 de julio de 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra la abreviatura del tipo en la celda del día, no solo el color de fondo', () => {
    const type = buildType();
    const request = buildRequest();

    renderCalendar([request], [type]);

    expect(screen.getByText('PM')).toBeInTheDocument();
  });

  it('distingue dos tipos con abreviaturas distintas aunque ambos se rendericen', () => {
    const paternidad = buildType({ id: 'type-2', code: 'paternidad', name: 'Paternidad', color: '#1E3A8A' });
    const remoto = buildType({ id: 'type-3', code: 'remoto', name: 'Remoto', color: '#8B5CF6' });
    const requestPaternidad = buildRequest({
      id: 'req-2',
      absenceTypeId: 'type-2',
      startDate: '2026-07-15',
      endDate: '2026-07-15',
    });
    const requestRemoto = buildRequest({
      id: 'req-3',
      absenceTypeId: 'type-3',
      startDate: '2026-07-16',
      endDate: '2026-07-16',
    });

    renderCalendar([requestPaternidad, requestRemoto], [paternidad, remoto]);

    expect(screen.getByText('PA')).toBeInTheDocument();
    expect(screen.getByText('RE')).toBeInTheDocument();
  });

  // A11Y-2: `#F9A8D4` (rosa de "Permiso Matrimonio") solo tiene 1.81:1 de
  // contraste con texto blanco fijo — muy por debajo del mínimo AA de
  // 4.5:1. Con negro da 11.58:1. La abreviatura hereda el `color` del
  // contenedor de la celda (`.dayContent`), así que se comprueba ahí.
  it('usa texto negro en la celda cuando el color de fondo no cumple contraste con blanco', () => {
    const type = buildType();
    const request = buildRequest();

    renderCalendar([request], [type]);

    expect(screen.getByText('PM').parentElement).toHaveStyle({ color: '#000000' });
  });
});
