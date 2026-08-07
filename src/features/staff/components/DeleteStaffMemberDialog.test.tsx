import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { DeleteStaffMemberDialog } from './DeleteStaffMemberDialog';
import type { StaffMember } from '../domain/models';

const remove = vi.fn();

vi.mock('../infrastructure/staff-api.adapter', () => ({
  staffApiAdapter: {
    remove: (id: string) => remove(id),
  },
}));

function buildMember(): StaffMember {
  return {
    id: 'user-1',
    fullName: 'Ana Ruiz',
    email: 'ana@ameliahub.com',
    avatarUrl: null,
    jobTitle: null,
    contractType: null,
    departmentId: null,
    departmentName: null,
    entityId: null,
    entityCode: 'hub',
    entityName: 'Amelia Hub',
    roleId: 'r-1',
    role: 'empleado',
    status: 'active',
    isActive: true,
    hireDate: null,
    vacationDaysPerYear: 23,
    vacationDaysOverride: null,
    vacationDaysCalculated: 23,
    createdAt: '2026-01-01T00:00:00Z',
  } as StaffMember;
}

/** El `<Label htmlFor>` apunta al input de confirmación; se busca por su
 * etiqueta y no por placeholder para que el test falle si se rompe la
 * asociación label-input, que es lo que lo hace accesible. */
function confirmInput(): HTMLElement {
  return screen.getByLabelText(/escribe/i);
}

function renderDialog(onClose = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return render(<DeleteStaffMemberDialog member={buildMember()} onClose={onClose} />, { wrapper });
}

describe('DeleteStaffMemberDialog', () => {
  beforeEach(() => {
    remove.mockReset();
    remove.mockResolvedValue(undefined);
  });

  it('mantiene el botón deshabilitado hasta escribir el nombre completo', () => {
    renderDialog();

    const button = screen.getByRole('button', { name: /dar de baja definitiva/i });
    expect(button).toBeDisabled();

    // Un nombre a medias NO habilita: es justo el caso del clic apresurado.
    fireEvent.change(confirmInput(), { target: { value: 'Ana' } });
    expect(button).toBeDisabled();

    fireEvent.change(confirmInput(), { target: { value: 'Ana Ruiz' } });
    expect(button).toBeEnabled();
  });

  it('no llama al backend si no se ha confirmado el nombre', () => {
    renderDialog();

    fireEvent.change(confirmInput(), { target: { value: 'Otra Persona' } });
    expect(screen.getByRole('button', { name: /dar de baja definitiva/i })).toBeDisabled();
    expect(remove).not.toHaveBeenCalled();
  });

  it('acepta el nombre sin distinguir mayúsculas ni espacios sobrantes', () => {
    renderDialog();

    fireEvent.change(confirmInput(), { target: { value: '  ana ruiz  ' } });

    expect(screen.getByRole('button', { name: /dar de baja definitiva/i })).toBeEnabled();
  });

  it('explica qué se borra y qué se conserva', () => {
    // Sin esto, «eliminar» hace pensar que también desaparecen los fichajes, y
    // o nadie usa la acción o alguien la usa creyendo que limpia el historial.
    renderDialog();

    expect(screen.getByText(/se borra/i)).toBeInTheDocument();
    expect(screen.getByText(/se conserva/i)).toBeInTheDocument();
    expect(screen.getByText(/iban/i)).toBeInTheDocument();
    // `getAllBy`: aparece en la columna "Se conserva" y otra vez en la nota
    // que explica los cuatro años. Que salga dos veces es intencionado.
    expect(screen.getAllByText(/registro de jornada/i).length).toBeGreaterThan(0);
  });

  it('da de baja y cierra cuando el nombre coincide', async () => {
    const onClose = vi.fn();
    renderDialog(onClose);

    fireEvent.change(confirmInput(), { target: { value: 'Ana Ruiz' } });
    fireEvent.click(screen.getByRole('button', { name: /dar de baja definitiva/i }));

    await waitFor(() => expect(remove).toHaveBeenCalledWith('user-1'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
