import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmployeeAbsencesView } from './EmployeeAbsencesView';

vi.mock('../application/useAbsenceTypes', () => ({
  useAbsenceTypes: () => ({ data: [] }),
}));
vi.mock('../application/useAbsenceBalance', () => ({
  useAbsenceBalance: () => ({ data: [] }),
}));
vi.mock('../application/useAbsenceRequests', () => ({
  useAbsenceRequests: () => ({ data: [] }),
}));
vi.mock('@/features/holidays/application/useHolidays', () => ({
  useHolidays: () => ({ data: [] }),
}));
vi.mock('./AbsenceBalanceDonut', () => ({
  AbsenceBalanceDonut: () => <div>donut</div>,
}));
vi.mock('./AbsenceCompactList', () => ({
  AbsenceCompactList: () => <div>lista compacta</div>,
}));
vi.mock('./AbsenceMonthCalendar', () => ({
  AbsenceMonthCalendar: () => <div>calendario</div>,
}));
vi.mock('./AbsenceRequestsTabs', () => ({
  AbsenceRequestsTabs: () => <div>pestañas de solicitudes</div>,
}));
vi.mock('./UpcomingAbsencesCard', () => ({
  UpcomingAbsencesCard: () => <div>próximas ausencias</div>,
}));
// Se mockea porque consume `useTeamCalendar` (TanStack Query) y este test no
// monta un QueryClientProvider — su propio comportamiento se prueba en
// `TeamAbsencesTodayCard.test.tsx`.
vi.mock('./TeamAbsencesTodayCard', () => ({
  TeamAbsencesTodayCard: () => <div>ausencias del equipo hoy</div>,
}));
vi.mock('./NewAbsenceRequestDialog', () => ({
  NewAbsenceRequestDialog: () => <button type="button">Solicitar ausencia</button>,
}));

// A11Y-1: el <h1> de la vista es el del Topbar (AppLayout) — "Ausencias y
// vacaciones" es un rótulo de sección duplicado con el del Topbar, así que
// baja a <h2>.
describe('EmployeeAbsencesView — un solo <h1> por vista (A11Y-1)', () => {
  it('no emite un encabezado de nivel 1', () => {
    render(<EmployeeAbsencesView />);

    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
  });

  it('muestra el título de la vista como encabezado de nivel 2', () => {
    render(<EmployeeAbsencesView />);

    expect(screen.getByRole('heading', { level: 2, name: 'Ausencias y vacaciones' })).toBeInTheDocument();
  });
});
