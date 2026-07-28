import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMarkRead } from '../application/useMarkRead';
import { useNotifications } from '../application/useNotifications';
import type { Notification, NotificationPage } from '../domain/models';
import { NotificationPopup } from './NotificationPopup';

vi.mock('../application/useNotifications', () => ({
  useNotifications: vi.fn(),
}));
vi.mock('../application/useMarkRead', () => ({
  useMarkRead: vi.fn(),
}));

// LOGIC-1: `clockIn()` (disparar-y-olvidar) se sustituye por `mutateAsync`
// para poder esperar el resultado real antes de descartar el aviso.
const clockInMutateAsync = vi.fn();
vi.mock('@/features/time-clock/application/useTimeClockLiveActions', () => ({
  useClockIn: () => ({ mutateAsync: clockInMutateAsync, isPending: false }),
}));

function mockNotifications(items: Notification[]) {
  const page: NotificationPage = { items, nextBefore: null };
  vi.mocked(useNotifications).mockReturnValue({ data: page } as ReturnType<typeof useNotifications>);
}

function mockMarkRead(markRead = vi.fn()) {
  vi.mocked(useMarkRead).mockReturnValue({
    mutate: markRead,
  } as unknown as ReturnType<typeof useMarkRead>);
  return markRead;
}

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'notif-1',
    type: 'clock_in_reminder',
    title: 'Registra tu jornada',
    body: 'Todavía no has fichado hoy.',
    url: '/control-horario',
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPopup() {
  return render(
    <MemoryRouter>
      <NotificationPopup />
    </MemoryRouter>,
  );
}

describe('NotificationPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('no renderiza nada si no hay notificación pendiente de hoy', () => {
    mockNotifications([]);
    mockMarkRead();
    renderPopup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no renderiza nada si la única notificación de hoy ya está leída', () => {
    mockNotifications([notification({ read: true })]);
    mockMarkRead();
    renderPopup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('no renderiza nada si la notificación pendiente es de un tipo ajeno al pop-up', () => {
    mockNotifications([notification({ type: 'birthday', title: 'Cumpleaños' })]);
    mockMarkRead();
    renderPopup();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renderiza el recordatorio de fichaje con su botón de acción', () => {
    mockNotifications([notification()]);
    mockMarkRead();
    renderPopup();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Registra tu jornada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fichar ahora/i })).toBeInTheDocument();
  });

  it('ficha y marca como leída al pulsar "Fichar ahora" cuando el fichaje tiene éxito', async () => {
    clockInMutateAsync.mockResolvedValueOnce(undefined);
    const markRead = mockMarkRead();
    mockNotifications([notification()]);
    renderPopup();

    fireEvent.click(screen.getByRole('button', { name: /fichar ahora/i }));

    await waitFor(() => expect(markRead).toHaveBeenCalledWith('notif-1'));
    expect(clockInMutateAsync).toHaveBeenCalled();
  });

  // LOGIC-1: antes, `clockIn()` se disparaba sin esperar resultado y
  // `dismiss(target)` cerraba el modal y marcaba la notificación como
  // leída de forma incondicional — si el fichaje fallaba (ya fichado,
  // regla de negocio, red caída), el usuario veía el modal cerrarse como
  // si hubiera funcionado y la notificación quedaba consumida sin volver
  // a avisar ese día.
  it('mantiene el modal abierto y muestra un error si el fichaje falla, sin marcar la notificación como leída', async () => {
    clockInMutateAsync.mockRejectedValueOnce(new Error('ya existe un fichaje abierto'));
    const markRead = mockMarkRead();
    mockNotifications([notification()]);
    renderPopup();

    fireEvent.click(screen.getByRole('button', { name: /fichar ahora/i }));

    await waitFor(() => expect(clockInMutateAsync).toHaveBeenCalled());

    expect(
      await screen.findByText('No se ha podido registrar el fichaje. Inténtalo de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(markRead).not.toHaveBeenCalled();
  });

  it('renderiza la felicitación de aniversario con su CTA al perfil', () => {
    mockNotifications([
      notification({
        id: 'notif-2',
        type: 'work_anniversary',
        title: '¡Hoy cumples 3 años en Amelia!',
        body: null,
        url: '/perfil',
      }),
    ]);
    mockMarkRead();
    renderPopup();

    expect(screen.getByText('¡Hoy cumples 3 años en Amelia!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir a mi perfil/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /fichar ahora/i })).not.toBeInTheDocument();
  });

  it('no reaparece tras marcar como leída (cerrar con la X)', () => {
    const markRead = mockMarkRead();
    mockNotifications([notification()]);
    renderPopup();

    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }));

    expect(markRead).toHaveBeenCalledWith('notif-1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
