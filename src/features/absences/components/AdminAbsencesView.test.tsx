import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminAbsencesView } from './AdminAbsencesView';

vi.mock('../application/useAbsenceTypes', () => ({
  useAbsenceTypes: () => ({ data: [] }),
}));
vi.mock('../application/useAbsenceRequests', () => ({
  useAbsenceRequests: () => ({ data: [] }),
}));
vi.mock('../application/useAbsenceBalance', () => ({
  useAbsenceBalance: () => ({ data: [] }),
}));
vi.mock('@/features/dashboard/application/useDashboardSummary', () => ({
  useDashboardSummary: () => ({ data: undefined }),
}));
vi.mock('./AbsenceApprovalList', () => ({
  AbsenceApprovalList: () => <div>lista de aprobación</div>,
}));
vi.mock('./TeamAbsenceGantt', () => ({
  TeamAbsenceGantt: () => <div>gantt</div>,
}));
vi.mock('./AbsenceRequestsTabs', () => ({
  AbsenceRequestsTabs: () => <div>mis solicitudes</div>,
}));
vi.mock('./NewAbsenceRequestDialog', () => ({
  NewAbsenceRequestDialog: ({ trigger }: { trigger: React.ReactNode }) => <>{trigger}</>,
}));

// A11Y-1: el <h1> de la vista es el del Topbar (AppLayout) — "Ausencias ·
// gestión" es un rótulo de sección duplicado con el del Topbar, así que
// baja a <h2>.
describe('AdminAbsencesView — un solo <h1> por vista (A11Y-1)', () => {
  it('no emite un encabezado de nivel 1', () => {
    render(<AdminAbsencesView />);

    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
  });

  it('muestra el título de la vista como encabezado de nivel 2', () => {
    render(<AdminAbsencesView />);

    expect(screen.getByRole('heading', { level: 2, name: 'Ausencias · gestión' })).toBeInTheDocument();
  });
});

// El administrador también es plantilla. Antes esta vista solo tenía la
// bandeja de aprobación y el gantt, así que quien gestiona las ausencias no
// tenía dónde pedir las suyas: la única vía era el botón del Topbar, visible
// solo con un fichaje abierto.
describe('AdminAbsencesView — sus propias ausencias', () => {
  it('ofrece solicitar una ausencia', () => {
    render(<AdminAbsencesView />);

    expect(screen.getByRole('button', { name: /Solicitar ausencia/i })).toBeInTheDocument();
  });

  it('muestra su saldo de vacaciones', () => {
    render(<AdminAbsencesView />);

    expect(screen.getByText(/Mis días/)).toBeInTheDocument();
    expect(screen.getByText('Base anual')).toBeInTheDocument();
  });

  it('sigue mostrando la bandeja de aprobación y el calendario del equipo', () => {
    render(<AdminAbsencesView />);

    expect(screen.getByText('lista de aprobación')).toBeInTheDocument();
    expect(screen.getByText('gantt')).toBeInTheDocument();
  });
});
