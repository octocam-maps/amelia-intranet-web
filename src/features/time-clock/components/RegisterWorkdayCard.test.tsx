import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RegisterWorkdayCard } from './RegisterWorkdayCard';

vi.mock('./TimeClockEntryForm', () => ({
  TimeClockEntryForm: () => <div>formulario de un día</div>,
}));
vi.mock('./BatchTimeClockEntryForm', () => ({
  BatchTimeClockEntryForm: () => <div>formulario de rango</div>,
}));

describe('RegisterWorkdayCard', () => {
  it('reúne los dos flujos en una sola tarjeta, no en dos seguidas', () => {
    render(<RegisterWorkdayCard />);
    expect(screen.getByText('Registrar jornada')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Un día' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Varios días' })).toBeInTheDocument();
  });

  it('abre en "Un día", que es el caso más frecuente', () => {
    render(<RegisterWorkdayCard />);
    expect(screen.getByText('formulario de un día')).toBeInTheDocument();
    expect(screen.queryByText('formulario de rango')).not.toBeInTheDocument();
  });

  it('cambia al formulario de rango al elegir "Varios días"', () => {
    render(<RegisterWorkdayCard />);
    // Radix Tabs cambia con `mouseDown`, no con `click` (mismo patrón que
    // `AbsenceRequestsTabs.test.tsx`).
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Varios días' }));
    expect(screen.getByText('formulario de rango')).toBeInTheDocument();
  });

  it('explica la diferencia entre los dos modos, que no es evidente', () => {
    // Sin este texto, elegir una pestaña u otra es adivinar cuál excluye
    // fines de semana y festivos.
    render(<RegisterWorkdayCard />);
    expect(screen.getByText(/incluso si es fin de semana o festivo/i)).toBeInTheDocument();

    // Radix Tabs cambia con `mouseDown`, no con `click` (mismo patrón que
    // `AbsenceRequestsTabs.test.tsx`).
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Varios días' }));
    expect(screen.getByText(/mismo horario a varios días seguidos/i)).toBeInTheDocument();
  });
});
