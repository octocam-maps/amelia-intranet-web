import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RoleChange } from '../domain/models';
import { RoleHistoryTimeline } from './RoleHistoryTimeline';

function change(overrides: Partial<RoleChange> = {}): RoleChange {
  return {
    id: 'history-1',
    fromRole: 'becario',
    toRole: 'empleado',
    changedById: 'admin-1',
    changedByName: 'Beatriz Luna',
    changedAt: '2026-07-31T10:00:00Z',
    note: null,
    ...overrides,
  };
}

describe('RoleHistoryTimeline', () => {
  it('pinta el alta inicial como «Alta», no como una transición', () => {
    // `fromRole: null` es SIGNIFICATIVO (no venía de ningún rol previo); pintarlo
    // como «De ??? a Becario» inventaría un rol que nunca existió.
    render(
      <RoleHistoryTimeline
        changes={[change({ fromRole: null, toRole: 'becario' })]}
        isLoading={false}
        isError={false}
      />
    );

    expect(screen.getByText(/Alta como/)).toBeInTheDocument();
    expect(screen.getByText('Becario')).toBeInTheDocument();
  });

  it('usa las etiquetas de la UI, no los codes del backend', () => {
    render(<RoleHistoryTimeline changes={[change()]} isLoading={false} isError={false} />);

    // `empleado` se muestra como «Empleado» (`USER_ROLE_LABEL`), nunca el code.
    expect(screen.getByText('Empleado')).toBeInTheDocument();
    expect(screen.queryByText('empleado')).not.toBeInTheDocument();
  });

  it('dice «autor no registrado» cuando no consta, sin inventar un autor', () => {
    // Las filas que sembró la migración 039 para la plantilla existente pueden
    // no tener autor. Rellenarlo con «Sistema» sería una auditoría que miente.
    render(
      <RoleHistoryTimeline
        changes={[change({ changedById: null, changedByName: null })]}
        isLoading={false}
        isError={false}
      />
    );

    expect(screen.getByText(/autor no registrado/)).toBeInTheDocument();
  });

  it('respeta el orden que da el backend (más reciente primero)', () => {
    render(
      <RoleHistoryTimeline
        changes={[
          change({ id: 'b', fromRole: 'becario', toRole: 'empleado' }),
          change({ id: 'a', fromRole: null, toRole: 'becario' }),
        ]}
        isLoading={false}
        isError={false}
      />
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('De Becario a Empleado');
    expect(items[1]).toHaveTextContent('Alta como Becario');
  });

  it('distingue cargando, error y vacío', () => {
    const { rerender } = render(
      <RoleHistoryTimeline changes={[]} isLoading isError={false} />
    );
    expect(screen.getByText(/Cargando el historial/)).toBeInTheDocument();

    rerender(<RoleHistoryTimeline changes={[]} isLoading={false} isError />);
    expect(screen.getByText(/No se ha podido cargar/)).toBeInTheDocument();

    rerender(<RoleHistoryTimeline changes={[]} isLoading={false} isError={false} />);
    expect(screen.getByText(/Sin cambios de rol registrados/)).toBeInTheDocument();
  });
});
