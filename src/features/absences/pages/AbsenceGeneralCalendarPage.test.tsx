import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRole } from '@/features/auth/domain/models';
import { AbsenceGeneralCalendarPage } from './AbsenceGeneralCalendarPage';

// El store expone el rol del usuario actual — el selector de empleado
// (RF-A1) se oculta para cualquier rol que no sea admin/socio, doble capa
// con el 403 que ya lanza el backend (`GetAbsenceCalendarUseCase`).
const { mockUser } = vi.hoisted(() => ({
  mockUser: { id: 'me-1', role: 'administrador' as UserRole },
}));

vi.mock('@/store', () => ({
  useStore: (selector: (state: { user: typeof mockUser }) => unknown) =>
    selector({ user: mockUser }),
}));

const { listDirectory } = vi.hoisted(() => ({
  listDirectory: vi.fn().mockResolvedValue([
    { id: 'user-1', fullName: 'Ana García', email: 'ana@ameliahub.com', avatarUrl: null, jobTitle: null, entityCode: null, entityName: null, phone: null },
    { id: 'user-2', fullName: 'Luis Pérez', email: 'luis@ameliahub.com', avatarUrl: null, jobTitle: null, entityCode: null, entityName: null, phone: null },
  ]),
}));

vi.mock('@/features/team/infrastructure/team-api.adapter', () => ({
  teamApiAdapter: { listDirectory },
}));

const { listCalendar, exportCalendarXlsx, exportCalendarPdf } = vi.hoisted(() => ({
  listCalendar: vi.fn().mockResolvedValue([]),
  exportCalendarXlsx: vi.fn().mockResolvedValue(new Blob(['xlsx'])),
  exportCalendarPdf: vi.fn().mockResolvedValue(new Blob(['pdf'])),
}));

vi.mock('../infrastructure/absences-api.adapter', () => ({
  absencesApiAdapter: { listCalendar, exportCalendarXlsx, exportCalendarPdf },
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AbsenceGeneralCalendarPage />
    </QueryClientProvider>
  );
}

describe('AbsenceGeneralCalendarPage — selector de empleado (RF-A1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listDirectory.mockResolvedValue([
      { id: 'user-1', fullName: 'Ana García', email: 'ana@ameliahub.com', avatarUrl: null, jobTitle: null, entityCode: null, entityName: null, phone: null },
      { id: 'user-2', fullName: 'Luis Pérez', email: 'luis@ameliahub.com', avatarUrl: null, jobTitle: null, entityCode: null, entityName: null, phone: null },
    ]);
    listCalendar.mockResolvedValue([]);
    exportCalendarXlsx.mockResolvedValue(new Blob(['xlsx']));
    exportCalendarPdf.mockResolvedValue(new Blob(['pdf']));
    // jsdom no implementa `URL.createObjectURL` — los hooks de export lo
    // necesitan para disparar el "Guardar como" del navegador. Tampoco
    // implementa la navegación de un `<a href="blob:...">` real (harness
    // sin browser real) — se stubea `click()` para evitar el warning
    // "Not implemented: navigation" sin dejar de ejercer el hook real.
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue('blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mockUser.role = 'administrador';
  });

  it('muestra el selector de empleado para un Admin', async () => {
    renderPage();

    expect(await screen.findByLabelText('Filtrar export por empleado')).toBeInTheDocument();
  });

  it('muestra el selector de empleado para un Socio', async () => {
    mockUser.role = 'socio';
    renderPage();

    expect(await screen.findByLabelText('Filtrar export por empleado')).toBeInTheDocument();
  });

  it('NO muestra el selector de empleado para un Empleado (aunque el backend ya lo rechace)', async () => {
    mockUser.role = 'empleado';
    renderPage();

    await waitFor(() => {
      expect(screen.queryByLabelText('Filtrar export por empleado')).not.toBeInTheDocument();
    });
  });

  it('NO muestra el selector de empleado para un externo-invitado', async () => {
    mockUser.role = 'externo_invitado';
    renderPage();

    await waitFor(() => {
      expect(screen.queryByLabelText('Filtrar export por empleado')).not.toBeInTheDocument();
    });
  });

  it('exporta sin userId cuando no se elige ningún empleado (comportamiento por defecto)', async () => {
    renderPage();

    const exportButton = await screen.findByRole('button', { name: /Exportar Excel/i });
    fireEvent.click(exportButton);

    await waitFor(() => expect(exportCalendarXlsx).toHaveBeenCalledTimes(1));
    const [params] = exportCalendarXlsx.mock.calls[0] as [{ userId?: string }];
    expect(params.userId).toBeUndefined();
  });

  it('exporta PDF sin userId cuando no se elige ningún empleado', async () => {
    renderPage();

    const exportButton = await screen.findByRole('button', { name: /Exportar PDF/i });
    fireEvent.click(exportButton);

    await waitFor(() => expect(exportCalendarPdf).toHaveBeenCalledTimes(1));
    const [params] = exportCalendarPdf.mock.calls[0] as [{ userId?: string }];
    expect(params.userId).toBeUndefined();
  });
});
