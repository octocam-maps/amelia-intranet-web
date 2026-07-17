import { describe, expect, it } from 'vitest';
import { metricsFromDTO, orgFilterOptionsFromStaffLookup } from './mappers';
import type { AdminMetricsDTO, StaffLookupMemberDTO } from './dtos';

describe('metricsFromDTO', () => {
  it('mapea kpis a camelCase', () => {
    const dto: AdminMetricsDTO = {
      kpis: { absent_today: 2, pending_approvals: 3, clocked_in_now: 14, punctuality_pct: 92 },
    };

    const result = metricsFromDTO(dto);

    expect(result.kpis).toEqual({
      absentToday: 2,
      pendingApprovals: 3,
      clockedInNow: 14,
      punctualityPct: 92,
    });
  });
});

describe('orgFilterOptionsFromStaffLookup', () => {
  it('deduplica entidades y departamentos por id', () => {
    const members: StaffLookupMemberDTO[] = [
      { id: '1', entity_id: 'e-hub', entity_code: 'hub', department_id: 'd-1', department_name: 'Operaciones' },
      { id: '2', entity_id: 'e-hub', entity_code: 'hub', department_id: 'd-1', department_name: 'Operaciones' },
      { id: '3', entity_id: 'e-lab', entity_code: 'lab', department_id: 'd-2', department_name: 'I+D' },
      { id: '4', entity_id: null, entity_code: null, department_id: null, department_name: null },
    ];

    const result = orgFilterOptionsFromStaffLookup(members);

    expect(result.entities).toEqual([
      { id: 'e-hub', code: 'hub', name: 'Amelia Hub' },
      { id: 'e-lab', code: 'lab', name: 'Amelia Lab' },
    ]);
    expect(result.departments).toEqual([
      { id: 'd-2', name: 'I+D', entityId: 'e-lab' },
      { id: 'd-1', name: 'Operaciones', entityId: 'e-hub' },
    ]);
  });
});
