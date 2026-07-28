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
});
