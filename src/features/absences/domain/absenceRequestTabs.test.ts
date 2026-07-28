import { describe, expect, it } from 'vitest';
import { categorizeAbsenceRequestsByTab } from './absenceRequestTabs';
import type { AbsenceRequest } from './models';

const TODAY = new Date(2026, 6, 28); // 28 de julio de 2026 (fecha-only)

function buildRequest(overrides: Partial<AbsenceRequest> = {}): AbsenceRequest {
  return {
    id: 'req-1',
    userId: 'user-1',
    absenceTypeId: 'type-1',
    startDate: '2026-07-01',
    endDate: '2026-07-01',
    daysCount: 1,
    reason: null,
    status: 'approved',
    reviewedBy: null,
    reviewNote: null,
    userFullName: null,
    ...overrides,
  };
}

describe('categorizeAbsenceRequestsByTab', () => {
  it('una solicitud aprobada cuyo periodo no ha terminado va a "approved"', () => {
    const request = buildRequest({ id: 'r1', status: 'approved', startDate: '2026-08-01', endDate: '2026-08-05' });

    const tabs = categorizeAbsenceRequestsByTab([request], TODAY);

    expect(tabs.approved).toEqual([request]);
    expect(tabs.pending).toEqual([]);
    expect(tabs.past).toEqual([]);
  });

  it('una solicitud pendiente cuyo periodo no ha terminado va a "pending"', () => {
    const request = buildRequest({ id: 'r2', status: 'pending', startDate: '2026-08-01', endDate: '2026-08-05' });

    const tabs = categorizeAbsenceRequestsByTab([request], TODAY);

    expect(tabs.pending).toEqual([request]);
    expect(tabs.approved).toEqual([]);
    expect(tabs.past).toEqual([]);
  });

  it('una solicitud aprobada cuyo endDate ya pasó va a "past", no a "approved"', () => {
    const request = buildRequest({ id: 'r3', status: 'approved', startDate: '2026-06-01', endDate: '2026-06-05' });

    const tabs = categorizeAbsenceRequestsByTab([request], TODAY);

    expect(tabs.past).toEqual([request]);
    expect(tabs.approved).toEqual([]);
  });

  it('una solicitud pendiente cuyo endDate ya pasó también va a "past"', () => {
    const request = buildRequest({ id: 'r4', status: 'pending', startDate: '2026-06-01', endDate: '2026-06-05' });

    const tabs = categorizeAbsenceRequestsByTab([request], TODAY);

    expect(tabs.past).toEqual([request]);
    expect(tabs.pending).toEqual([]);
  });

  it('rejected y cancelled van a "past" sin importar la fecha', () => {
    const rejected = buildRequest({ id: 'r5', status: 'rejected', startDate: '2026-08-01', endDate: '2026-08-05' });
    const cancelled = buildRequest({ id: 'r6', status: 'cancelled', startDate: '2026-08-01', endDate: '2026-08-05' });

    const tabs = categorizeAbsenceRequestsByTab([rejected, cancelled], TODAY);

    expect(tabs.past).toEqual([rejected, cancelled]);
  });

  it('una solicitud que termina HOY todavía no se considera pasada', () => {
    const request = buildRequest({ id: 'r7', status: 'approved', startDate: '2026-07-26', endDate: '2026-07-28' });

    const tabs = categorizeAbsenceRequestsByTab([request], TODAY);

    expect(tabs.approved).toEqual([request]);
    expect(tabs.past).toEqual([]);
  });

  it('lista vacía devuelve las 3 pestañas vacías', () => {
    expect(categorizeAbsenceRequestsByTab([], TODAY)).toEqual({ approved: [], pending: [], past: [] });
  });
});
