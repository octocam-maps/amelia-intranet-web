import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UserRole } from '@/features/auth/domain/models';
import { DashboardPage } from './DashboardPage';

const { mockUser } = vi.hoisted(() => ({
  mockUser: { fullName: 'Marta Sánchez', role: 'empleado' as UserRole },
}));

vi.mock('@/store', () => ({
  useStore: (selector: (state: { user: typeof mockUser }) => unknown) => selector({ user: mockUser }),
}));

vi.mock('../application/useDashboardSummary', () => ({
  useDashboardSummary: () => ({
    data: {
      vacationBalance: { availableDays: 10, usedDays: 5, entitledDays: 22 },
      upcomingHolidays: [],
      pendingAbsenceRequests: [],
    },
    isLoading: false,
  }),
}));
vi.mock('../application/useAdminMetrics', () => ({
  useAdminMetrics: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@/features/time-clock/components/LiveClockCard', () => ({
  LiveClockCard: () => <div>fichaje</div>,
}));
vi.mock('../components/AdminFiltersBar', () => ({ AdminFiltersBar: () => <div>filtros</div> }));
vi.mock('../components/AdminHomeTabs', () => ({ AdminHomeTabs: () => <div>tabs</div> }));
vi.mock('../components/AdminKpiRow', () => ({ AdminKpiRow: () => <div>kpis</div> }));
vi.mock('../components/AdminOnboardingSummaryCard', () => ({
  AdminOnboardingSummaryCard: () => <div>onboarding</div>,
}));
vi.mock('../components/AdminQuickLinksCard', () => ({ AdminQuickLinksCard: () => <div>accesos</div> }));
vi.mock('../components/AnnouncementsCard', () => ({ AnnouncementsCard: () => <div>anuncios</div> }));
vi.mock('../components/AnonymousMailboxCard', () => ({ AnonymousMailboxCard: () => <div>buzón</div> }));
vi.mock('../components/RecentAbsenceRequestsCard', () => ({
  RecentAbsenceRequestsCard: () => <div>solicitudes</div>,
}));
vi.mock('../components/UpcomingBirthdaysCard', () => ({
  UpcomingBirthdaysCard: () => <div>cumpleaños</div>,
}));
vi.mock('../components/UpcomingHolidaysCard', () => ({ UpcomingHolidaysCard: () => <div>festivos</div> }));
vi.mock('../components/VacationSummaryCard', () => ({ VacationSummaryCard: () => <div>vacaciones</div> }));

// A11Y-1: el <h1> de la vista es el del Topbar (AppLayout) — el saludo
// "Hola, {nombre}" es contenido (un saludo), no el rótulo de la página, así
// que baja a <h2> en las dos ramas (empleado/admin y externo-invitado).
describe('DashboardPage — un solo <h1> por vista (A11Y-1)', () => {
  it('no emite un encabezado de nivel 1 para un empleado', () => {
    mockUser.role = 'empleado';
    render(<DashboardPage />);

    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 2, name: 'Hola, Marta' })).toBeInTheDocument();
  });

  it('no emite un encabezado de nivel 1 para un externo-invitado', () => {
    mockUser.role = 'externo_invitado';
    render(<DashboardPage />);

    expect(screen.queryAllByRole('heading', { level: 1 })).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 2, name: 'Hola, Marta' })).toBeInTheDocument();
  });
});

describe('DashboardPage — el hero no repite lo que ya dice el Topbar', () => {
  // El Topbar muestra sección + fecha en TODAS las vistas
  // (`Topbar.pageDate`), así que en Inicio la fecha salía dos veces seguidas:
  // "Miércoles, 29 de julio" y justo debajo "Miércoles, 29 de julio · Amelia
  // Hub". Mismo criterio con el que se resolvió el <h1> duplicado.
  const MONTHS =
    /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i;

  it.each(['empleado', 'administrador', 'externo_invitado'] as const)(
    'no imprime la fecha de hoy en el hero (%s)',
    (role) => {
      mockUser.role = role;
      const { container } = render(<DashboardPage />);

      expect(container.textContent).not.toMatch(MONTHS);
    }
  );

  it.each(['empleado', 'externo_invitado'] as const)(
    'no escribe a mano el nombre de una sociedad (%s)',
    (role) => {
      // "Amelia Hub" estaba hardcodeado y es falso para quien no sea de Hub:
      // solo 5 de 36 personas lo son. `AmeliaUser` trae `entityId`, no el
      // nombre, así que el dato real exige resolverlo contra `entities`.
      mockUser.role = role;
      const { container } = render(<DashboardPage />);

      expect(container.textContent).not.toContain('Amelia Hub');
    }
  );
});
