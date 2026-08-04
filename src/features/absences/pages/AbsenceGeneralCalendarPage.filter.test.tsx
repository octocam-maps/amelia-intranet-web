import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRole } from '@/features/auth/domain/models';
import { AbsenceGeneralCalendarPage } from './AbsenceGeneralCalendarPage';

/**
 * El selector de empleado (RF-A1) acota la GRILLA además de los exports.
 * Antes solo acotaba los exports: elegir a una persona dejaba la vista
 * intacta con toda la plantilla pintada —quien filtraba se seguía viendo a sí
 * mismo— y eso se leía como un filtro roto, no como una decisión de alcance.
 *
 * Va en un fichero aparte de `AbsenceGeneralCalendarPage.test.tsx` a
 * propósito: aquí se sustituye el `Select` de Radix por un `<select>` nativo
 * (no se puede abrir en jsdom, mismo motivo que en `StaffForm.test.tsx`) y ese
 * mock descarta el `SelectTrigger`, que es justo donde vive el `aria-label`
 * que comprueban los tests de visibilidad por rol del otro fichero.
 */
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    children: ReactNode;
  }) => (
    <select
      aria-label="Filtrar por empleado"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
}));

const { mockUser } = vi.hoisted(() => ({
  mockUser: { id: 'me-1', role: 'administrador' as UserRole },
}));

vi.mock('@/store', () => ({
  useStore: (selector: (state: { user: typeof mockUser }) => unknown) =>
    selector({ user: mockUser }),
}));

const { listDirectory } = vi.hoisted(() => ({ listDirectory: vi.fn() }));

vi.mock('@/features/team/infrastructure/team-api.adapter', () => ({
  teamApiAdapter: { listDirectory },
}));

const { listCalendar, exportCalendarXlsx, exportCalendarPdf } = vi.hoisted(() => ({
  listCalendar: vi.fn(),
  exportCalendarXlsx: vi.fn(),
  exportCalendarPdf: vi.fn(),
}));

vi.mock('../infrastructure/absences-api.adapter', () => ({
  absencesApiAdapter: { listCalendar, exportCalendarXlsx, exportCalendarPdf },
}));

const DIRECTORY = [
  {
    id: 'user-1',
    fullName: 'Ana García',
    email: 'ana@ameliahub.com',
    avatarUrl: null,
    jobTitle: null,
    entityCode: null,
    entityName: null,
    phone: null,
  },
  {
    id: 'me-1',
    fullName: 'Mauricio Donado',
    email: 'mauricio@ameliahub.com',
    avatarUrl: null,
    jobTitle: null,
    entityCode: null,
    entityName: null,
    phone: null,
  },
];

/** Una ausencia de quien está mirando la pantalla — es la fila que seguía
 *  apareciendo al filtrar por otra persona. */
const OWN_ENTRY = {
  requestId: 'req-1',
  userId: 'me-1',
  userFullName: 'Mauricio Donado',
  absenceTypeId: 'type-vac',
  absenceTypeName: 'Vacaciones',
  absenceTypeColor: '#00D170',
  startDate: '2026-08-10',
  endDate: '2026-08-14',
  status: 'approved' as const,
};

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AbsenceGeneralCalendarPage />
    </QueryClientProvider>
  );
}

function employeeFilter() {
  return screen.getByLabelText('Filtrar por empleado') as HTMLSelectElement;
}

/** Elige una opción del filtro. Espera a que la opción EXISTA antes del
 *  `change`: el `<select>` es controlado y descarta un valor que todavía no
 *  está entre sus `<option>` (el directorio llega por su propia petición), así
 *  que sin esta espera el evento se pierde en silencio y el test mide otra
 *  cosa. */
async function chooseEmployee(optionLabel: string, value: string) {
  await screen.findByRole('option', { name: optionLabel });
  fireEvent.change(employeeFilter(), { target: { value } });
}

/** El nombre de una persona aparece DOS veces en la pantalla: como fila de la
 *  grilla y como `<option>` del propio selector. `selector: 'span'` se queda
 *  solo con la fila — que es la que el filtro tiene que hacer desaparecer. */
function calendarRow(name: string) {
  return screen.findByText(name, { selector: 'span' });
}

describe('AbsenceGeneralCalendarPage — el filtro por empleado acota la grilla', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listDirectory.mockResolvedValue(DIRECTORY);
    // Sin filtro devuelve la ausencia propia; con `user_id` de otra persona,
    // el backend ya no devuelve nada (`list_calendar_entries` filtra).
    listCalendar.mockImplementation((params: { userId?: string }) =>
      Promise.resolve(params.userId ? [] : [OWN_ENTRY])
    );
    exportCalendarXlsx.mockResolvedValue(new Blob(['xlsx']));
    exportCalendarPdf.mockResolvedValue(new Blob(['pdf']));
    // jsdom no implementa `URL.createObjectURL` ni la navegación de un
    // `<a href="blob:...">` — mismo stub que `AbsenceGeneralCalendarPage.test.tsx`.
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue('blob:mock'),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mockUser.role = 'administrador';
  });

  it('pide el calendario global mientras no se elige a nadie', async () => {
    renderPage();

    await waitFor(() => expect(listCalendar).toHaveBeenCalledTimes(1));
    const [params] = listCalendar.mock.calls[0] as [{ userId?: string }];
    expect(params.userId).toBeUndefined();
    expect(await calendarRow('Mauricio Donado')).toBeInTheDocument();
  });

  it('al elegir a un empleado, vuelve a pedir el calendario con su user_id', async () => {
    renderPage();
    await waitFor(() => expect(listCalendar).toHaveBeenCalledTimes(1));

    await chooseEmployee('Ana García', 'user-1');

    await waitFor(() => expect(listCalendar).toHaveBeenCalledTimes(2));
    const [params] = listCalendar.mock.calls[1] as [{ userId?: string }];
    expect(params.userId).toBe('user-1');
  });

  it('quien filtra deja de verse a sí mismo en la grilla', async () => {
    renderPage();
    expect(await calendarRow('Mauricio Donado')).toBeInTheDocument();

    await chooseEmployee('Ana García', 'user-1');

    await waitFor(() => {
      expect(screen.queryByText('Mauricio Donado', { selector: 'span' })).not.toBeInTheDocument();
    });
  });

  it('el estado vacío nombra a la persona filtrada, en vez del genérico', async () => {
    renderPage();
    await calendarRow('Mauricio Donado');

    await chooseEmployee('Ana García', 'user-1');

    expect(
      await screen.findByText('Ana García no tiene ausencias registradas este mes.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Sin ausencias registradas este mes.')).not.toBeInTheDocument();
  });

  it('el encabezado dice de quién es lo que se está viendo', async () => {
    renderPage();

    expect(
      await screen.findByText(/Ausencias y vacaciones de toda la plantilla/)
    ).toBeInTheDocument();

    await chooseEmployee('Ana García', 'user-1');

    expect(await screen.findByText(/Ausencias y vacaciones de Ana García/)).toBeInTheDocument();
  });

  it('volver a "Todos los empleados" restaura la grilla completa', async () => {
    renderPage();
    await calendarRow('Mauricio Donado');

    await chooseEmployee('Ana García', 'user-1');
    await waitFor(() =>
      expect(screen.queryByText('Mauricio Donado', { selector: 'span' })).not.toBeInTheDocument()
    );

    await chooseEmployee('Todos los empleados', 'all');

    expect(await calendarRow('Mauricio Donado')).toBeInTheDocument();
  });

  it('el export sigue recibiendo el empleado elegido (RF-A1.1, sin regresión)', async () => {
    renderPage();
    await calendarRow('Mauricio Donado');

    await chooseEmployee('Ana García', 'user-1');
    fireEvent.click(screen.getByRole('button', { name: /Exportar Excel/i }));

    await waitFor(() => expect(exportCalendarXlsx).toHaveBeenCalledTimes(1));
    const [params] = exportCalendarXlsx.mock.calls[0] as [
      { userId?: string; subjectName?: string },
    ];
    expect(params.userId).toBe('user-1');
    expect(params.subjectName).toBe('Ana García');
  });
});
