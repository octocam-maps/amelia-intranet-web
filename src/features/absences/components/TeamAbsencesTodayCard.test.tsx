import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TeamAbsenceEntry } from '@/features/team/domain/models';
import { TeamAbsencesTodayCard } from './TeamAbsencesTodayCard';

const useTeamCalendar = vi.hoisted(() => vi.fn());
vi.mock('@/features/team/application/useTeamCalendar', () => ({ useTeamCalendar }));

function entry(overrides: Partial<TeamAbsenceEntry> = {}): TeamAbsenceEntry {
  const today = new Date().toISOString().slice(0, 10);
  return {
    userId: 'u1',
    fullName: 'Ana García',
    startDate: today,
    endDate: today,
    kind: 'vacaciones',
    ...overrides,
  };
}

describe('TeamAbsencesTodayCard', () => {
  it('deja claro que el alcance es el departamento, no toda la plantilla', () => {
    useTeamCalendar.mockReturnValue({ data: [], isLoading: false, isError: false });
    render(<TeamAbsencesTodayCard />);
    // Texto exacto del subtítulo: con la lista vacía el estado vacío también
    // menciona "tu departamento", así que un regex laxo casa con los dos.
    expect(screen.getByText('Compañeros de tu departamento')).toBeInTheDocument();
  });

  it('muestra quién está ausente hoy con su etiqueta de estado', () => {
    useTeamCalendar.mockReturnValue({
      data: [entry({ fullName: 'Ana García', kind: 'remoto' })],
      isLoading: false,
      isError: false,
    });
    render(<TeamAbsencesTodayCard />);
    expect(screen.getByText('Ana García')).toBeInTheDocument();
    expect(screen.getByText('Teletrabajando')).toBeInTheDocument();
  });

  it('NUNCA muestra el motivo real: un kind sensible se rotula como "Ausente"', () => {
    // El backend agrupa baja médica/duelo bajo `ausente` a propósito (RGPD).
    // Este test fija ese contrato en la UI: no debe aparecer ningún motivo.
    useTeamCalendar.mockReturnValue({
      data: [entry({ fullName: 'Pedro Ruiz', kind: 'ausente' })],
      isLoading: false,
      isError: false,
    });
    render(<TeamAbsencesTodayCard />);
    expect(screen.getByText('Ausente')).toBeInTheDocument();
    expect(screen.queryByText(/baja|médic|duelo|enfermedad/i)).not.toBeInTheDocument();
  });

  it('no lista a quien tiene una ausencia que no cubre hoy', () => {
    useTeamCalendar.mockReturnValue({
      data: [entry({ fullName: 'Futura Persona', startDate: '2099-01-01', endDate: '2099-01-05' })],
      isLoading: false,
      isError: false,
    });
    render(<TeamAbsencesTodayCard />);
    expect(screen.queryByText('Futura Persona')).not.toBeInTheDocument();
    expect(screen.getByText(/no falta nadie/i)).toBeInTheDocument();
  });

  it('avisa cuando la carga falla, en vez de fingir que no falta nadie', () => {
    useTeamCalendar.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    render(<TeamAbsencesTodayCard />);
    expect(screen.getByText(/no se pudo cargar/i)).toBeInTheDocument();
  });
});
