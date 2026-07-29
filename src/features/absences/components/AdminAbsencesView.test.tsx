import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminAbsencesView } from './AdminAbsencesView';

vi.mock('../application/useAbsenceTypes', () => ({
  useAbsenceTypes: () => ({ data: [] }),
}));
vi.mock('../application/useAbsenceRequests', () => ({
  useAbsenceRequests: () => ({ data: [] }),
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
