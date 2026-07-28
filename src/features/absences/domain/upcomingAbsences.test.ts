import { describe, expect, it } from 'vitest';
import { selectUpcomingAbsences } from './upcomingAbsences';
import type { AbsenceRequest } from './models';

const TODAY = new Date(2026, 6, 28); // 28 de julio de 2026 (fecha-only)

function buildRequest(overrides: Partial<AbsenceRequest> = {}): AbsenceRequest {
  return {
    id: 'req-1',
    userId: 'user-1',
    absenceTypeId: 'type-1',
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    daysCount: 5,
    reason: null,
    status: 'approved',
    reviewedBy: null,
    reviewNote: null,
    userFullName: null,
    ...overrides,
  };
}

describe('selectUpcomingAbsences', () => {
  it('incluye solo solicitudes aprobadas que empiezan hoy o después', () => {
    const upcoming = buildRequest({ id: 'r1', startDate: '2026-08-01' });
    const today = buildRequest({ id: 'r2', startDate: '2026-07-28', endDate: '2026-07-30' });
    const past = buildRequest({ id: 'r3', startDate: '2026-07-01', endDate: '2026-07-05' });

    const result = selectUpcomingAbsences([upcoming, today, past], TODAY);

    expect(result.map((r) => r.id)).toEqual(['r2', 'r1']);
  });

  it('excluye las solicitudes que no están aprobadas (pendientes, rechazadas, canceladas)', () => {
    const pending = buildRequest({ id: 'r1', status: 'pending', startDate: '2026-08-01' });
    const rejected = buildRequest({ id: 'r2', status: 'rejected', startDate: '2026-08-01' });
    const cancelled = buildRequest({ id: 'r3', status: 'cancelled', startDate: '2026-08-01' });

    expect(selectUpcomingAbsences([pending, rejected, cancelled], TODAY)).toEqual([]);
  });

  it('ordena por fecha de inicio ascendente', () => {
    const later = buildRequest({ id: 'later', startDate: '2026-09-01' });
    const sooner = buildRequest({ id: 'sooner', startDate: '2026-08-01' });

    const result = selectUpcomingAbsences([later, sooner], TODAY);

    expect(result.map((r) => r.id)).toEqual(['sooner', 'later']);
  });

  it('lista vacía si no hay ninguna aprobada futura', () => {
    expect(selectUpcomingAbsences([], TODAY)).toEqual([]);
  });
});
