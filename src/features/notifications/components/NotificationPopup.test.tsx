import { fireEvent, render, screen } from '@testing-library/react';
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

const clockInMutate = vi.fn();
vi.mock('@/features/time-clock/application/useTimeClockLiveActions', () => ({
  useClockIn: () => ({ mutate: clockInMutate, isPending: false }),
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

  it('ficha y marca como leída al pulsar "Fichar ahora"', () => {
    const markRead = mockMarkRead();
    mockNotifications([notification()]);
    renderPopup();

    fireEvent.click(screen.getByRole('button', { name: /fichar ahora/i }));

    expect(clockInMutate).toHaveBeenCalled();
    expect(markRead).toHaveBeenCalledWith('notif-1');
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
