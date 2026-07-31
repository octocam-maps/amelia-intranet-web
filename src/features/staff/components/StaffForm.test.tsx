import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoles } from '@/features/roles/application/useRoles';
import { useStaffRoleHistory } from '../application/useStaffRoleHistory';
import { useCreateStaffMember } from '../application/useCreateStaffMember';
import { useUpdateStaffMember } from '../application/useUpdateStaffMember';
import { StaffForm, UNSPECIFIED_CONTRACT_TYPE } from './StaffForm';
import type { StaffMember } from '../domain/models';

vi.mock('../application/useCreateStaffMember', () => ({ useCreateStaffMember: vi.fn() }));
vi.mock('../application/useUpdateStaffMember', () => ({ useUpdateStaffMember: vi.fn() }));
vi.mock('@/features/roles/application/useRoles', () => ({ useRoles: vi.fn() }));
vi.mock('../application/useStaffRoleHistory', () => ({ useStaffRoleHistory: vi.fn() }));

/**
 * El `Select` de Radix no se puede abrir en jsdom (mismo motivo documentado
 * en `AdminDocumentUploadForm.test.tsx`) — se sustituye por un `<select>`
 * nativo con la misma interfaz.
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
    <select value={value} onChange={(event) => onValueChange(event.target.value)}>
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

const createMember = vi.fn();
const updateMember = vi.fn();

function buildMember(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id: 'user-1',
    fullName: 'Sandra Ramírez',
    email: 'sandra@ameliahub.com',
    avatarUrl: null,
    jobTitle: 'Project Manager',
    contractType: null,
    departmentId: null,
    departmentName: null,
    entityId: 'entity-hub',
    entityCode: 'hub',
    entityName: 'Amelia Hub',
    roleId: 'role-1',
    role: 'empleado',
    status: 'active',
    hireDate: null,
    vacationDaysPerYear: null,
    vacationDaysOverride: null,
    vacationDaysCalculated: 0,
    isActive: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useCreateStaffMember).mockReturnValue({
    mutateAsync: createMember,
    error: null,
  } as unknown as ReturnType<typeof useCreateStaffMember>);
  vi.mocked(useUpdateStaffMember).mockReturnValue({
    mutateAsync: updateMember,
    error: null,
  } as unknown as ReturnType<typeof useUpdateStaffMember>);
  vi.mocked(useRoles).mockReturnValue({
    data: [{ id: 'role-1', code: 'empleado', name: 'Empleado' }],
    isLoading: false,
  } as unknown as ReturnType<typeof useRoles>);
  vi.mocked(useStaffRoleHistory).mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useStaffRoleHistory>);
});

/**
 * El mock de `Select` (ver arriba) descarta `SelectTrigger` entero —el
 * mismo `id`/`htmlFor` que asocia el `Label` real con Radix no llega al
 * `<select>` nativo—, así que no se puede localizar por
 * `getByLabelText`. Se localiza por posición, mismo patrón que
 * `AdminDocumentUploadForm.test.tsx`: "Tipo de contrato" es el primer
 * `combobox` del formulario (antes que "Rol de acceso").
 */
function contractTypeSelect() {
  return screen.getAllByRole('combobox')[0] as HTMLSelectElement;
}

describe('StaffForm — tipo de contrato', () => {
  it('el selector ofrece "Sin especificar" además de los tres tipos, en español', () => {
    render(<StaffForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    const select = contractTypeSelect();
    const labels = Array.from(select.querySelectorAll('option')).map((o) => o.textContent);

    expect(labels).toEqual(['Sin especificar', 'Jornada completa', 'Jornada parcial', 'Becario/a']);
  });

  it('en el alta, si no se toca el selector, se manda contractType null (no un fallback)', async () => {
    render(<StaffForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nombre completo *'), {
      target: { value: 'Nuevo Empleado' },
    });
    fireEvent.change(screen.getByLabelText('Correo corporativo *'), {
      target: { value: 'nuevo@ameliahub.com' },
    });
    fireEvent.change(screen.getByLabelText('Puesto *'), { target: { value: 'Analista' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir persona' }));

    await vi.waitFor(() => expect(createMember).toHaveBeenCalled());
    expect(createMember.mock.calls[0]![0]).toMatchObject({ contractType: null });
  });

  it('en el alta, seleccionar un tipo lo manda tal cual', async () => {
    render(<StaffForm onSaved={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Nombre completo *'), {
      target: { value: 'Nuevo Empleado' },
    });
    fireEvent.change(screen.getByLabelText('Correo corporativo *'), {
      target: { value: 'nuevo@ameliahub.com' },
    });
    fireEvent.change(screen.getByLabelText('Puesto *'), { target: { value: 'Analista' } });
    fireEvent.change(contractTypeSelect(), { target: { value: 'intern' } });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir persona' }));

    await vi.waitFor(() => expect(createMember).toHaveBeenCalled());
    expect(createMember.mock.calls[0]![0]).toMatchObject({ contractType: 'intern' });
  });

  it('en edición, un contractType null precarga el selector en "Sin especificar"', () => {
    render(<StaffForm member={buildMember({ contractType: null })} onSaved={vi.fn()} onCancel={vi.fn()} />);

    expect(contractTypeSelect().value).toBe(UNSPECIFIED_CONTRACT_TYPE);
  });

  it('en edición, un contractType existente precarga el selector con ese valor', () => {
    render(
      <StaffForm member={buildMember({ contractType: 'full_time' })} onSaved={vi.fn()} onCancel={vi.fn()} />
    );

    expect(contractTypeSelect().value).toBe('full_time');
  });

  it('en edición, volver a "Sin especificar" manda contractType: null EXPLÍCITO (vacía el dato), no lo omite', async () => {
    render(
      <StaffForm member={buildMember({ contractType: 'full_time' })} onSaved={vi.fn()} onCancel={vi.fn()} />
    );

    fireEvent.change(contractTypeSelect(), { target: { value: UNSPECIFIED_CONTRACT_TYPE } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await vi.waitFor(() => expect(updateMember).toHaveBeenCalled());
    const { input } = updateMember.mock.calls[0]![0];
    expect('contractType' in input).toBe(true);
    expect(input.contractType).toBeNull();
  });
});

describe('StaffForm — confirmación del cambio de rol', () => {
  /** El selector de rol es el SEGUNDO combobox (tras "Tipo de contrato"),
   * mismo criterio que `contractTypeSelect()`. */
  function roleSelect() {
    return screen.getAllByRole('combobox')[1] as HTMLSelectElement;
  }

  beforeEach(() => {
    // Dos roles para poder cambiar de uno a otro.
    vi.mocked(useRoles).mockReturnValue({
      data: [
        { id: 'role-1', code: 'empleado', name: 'Trabajador' },
        { id: 'role-2', code: 'becario', name: 'Becario' },
      ],
      isLoading: false,
    } as unknown as ReturnType<typeof useRoles>);
  });

  it('no guarda si el admin cancela la confirmación', async () => {
    // Es la protección que importa: cambiar el rol cierra la sesión de esa
    // persona, así que un clic accidental no debe llegar al backend.
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<StaffForm member={buildMember()} onSaved={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(roleSelect(), { target: { value: 'becario' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await vi.waitFor(() => expect(confirmSpy).toHaveBeenCalled());
    expect(updateMember).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('guarda si el admin acepta, y el aviso nombra las consecuencias', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<StaffForm member={buildMember()} onSaved={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(roleSelect(), { target: { value: 'becario' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await vi.waitFor(() => expect(updateMember).toHaveBeenCalled());
    const message = confirmSpy.mock.calls[0]![0] as string;
    expect(message).toContain('Deja de tener registro horario');
    expect(message).toContain('Conserva su fecha de alta');
    expect(message).toContain('Se cerrará su sesión');
    expect(updateMember.mock.calls[0]![0]).toMatchObject({
      input: expect.objectContaining({ role: 'becario' }),
    });
    confirmSpy.mockRestore();
  });

  it('no pregunta nada si el rol no cambia', async () => {
    // Editar solo el puesto no debe abrir un diálogo: acostumbrar al admin a
    // aceptar confirmaciones vacías es lo que hace que ignore la que importa.
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<StaffForm member={buildMember()} onSaved={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Puesto *'), { target: { value: 'Senior PM' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await vi.waitFor(() => expect(updateMember).toHaveBeenCalled());
    expect(confirmSpy).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
