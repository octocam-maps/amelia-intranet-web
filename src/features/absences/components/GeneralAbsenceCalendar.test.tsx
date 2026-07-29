import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AbsenceCalendarEntry } from '../domain/models';
import { GeneralAbsenceCalendar } from './GeneralAbsenceCalendar';

function buildEntry(overrides: Partial<AbsenceCalendarEntry> = {}): AbsenceCalendarEntry {
  return {
    requestId: 'req-1',
    userId: 'user-1',
    userFullName: 'Sandra Ramírez',
    absenceTypeId: 'type-1',
    absenceTypeName: 'Permiso Matrimonio',
    absenceTypeColor: '#F9A8D4',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    daysCount: 3,
    status: 'approved',
    ...overrides,
  };
}

const noop = vi.fn();

// RF-A5.7 (WCAG 1.4.1): la barra del Gantt general solo pintaba
// `backgroundColor` — el tipo solo se sabía al pasar el ratón (`title`).
// Con 10 tipos posibles bajo dicromacia, eso no basta.
describe('GeneralAbsenceCalendar — segundo canal de distinción (RF-A5.7)', () => {
  it('muestra la abreviatura del tipo dentro de la barra, no solo el color', () => {
    const entry = buildEntry();

    render(
      <GeneralAbsenceCalendar
        entries={[entry]}
        isLoading={false}
        cursor={new Date(2026, 6, 1)}
        onPreviousMonth={noop}
        onNextMonth={noop}
      />
    );

    expect(screen.getByText('PM')).toBeInTheDocument();
  });

  // A11Y-2: `#F9A8D4` (rosa de "Permiso Matrimonio") solo tiene 1.81:1 de
  // contraste con texto blanco fijo — muy por debajo del mínimo AA de
  // 4.5:1. Con negro da 11.58:1.
  it('usa texto negro sobre un color de fondo claro que no cumple contraste con blanco', () => {
    const entry = buildEntry({ absenceTypeColor: '#F9A8D4' });

    render(
      <GeneralAbsenceCalendar
        entries={[entry]}
        isLoading={false}
        cursor={new Date(2026, 6, 1)}
        onPreviousMonth={noop}
        onNextMonth={noop}
      />
    );

    expect(screen.getByText('PM')).toHaveStyle({ color: '#000000' });
  });
});
