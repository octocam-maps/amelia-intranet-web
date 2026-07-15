import { describe, expect, it } from 'vitest';
import { metricsFromDTO, orgFilterOptionsFromStaffLookup } from './mappers';
import type { AdminMetricsDTO, StaffLookupMemberDTO } from './dtos';

describe('metricsFromDTO', () => {
  it('mapea kpis, trends y radar a camelCase', () => {
    const dto: AdminMetricsDTO = {
      kpis: { absent_today: 2, pending_approvals: 3, clocked_in_now: 14, punctuality_pct: 92 },
      trends: { absences: [1, 2, 3], clocked_in: [10, 12, 14], punctuality: [80, 85, 92] },
      attendance_radar: [
        {
          user_id: 'u1',
          full_name: 'Marta Ruiz',
          avatar_url: null,
          kind: 'late_in',
          value_minutes: 20,
          detail: 'Entrada 09:20 (media)',
        },
      ],
    };

    const result = metricsFromDTO(dto);

    expect(result.kpis).toEqual({
      absentToday: 2,
      pendingApprovals: 3,
      clockedInNow: 14,
      punctualityPct: 92,
    });
    expect(result.trends.absences).toEqual([1, 2, 3]);
    expect(result.attendanceRadar).toEqual([
      {
        userId: 'u1',
        fullName: 'Marta Ruiz',
        avatarUrl: null,
        kind: 'late_in',
        valueMinutes: 20,
        detail: 'Entrada 09:20 (media)',
      },
    ]);
  });

  it('cae a "on_time" si el backend manda un kind fuera de contrato', () => {
    const dto: AdminMetricsDTO = {
      kpis: { absent_today: 0, pending_approvals: 0, clocked_in_now: 0, punctuality_pct: 0 },
      trends: { absences: [], clocked_in: [], punctuality: [] },
      attendance_radar: [
        {
          user_id: 'u1',
          full_name: 'X',
          avatar_url: null,
          kind: 'algo_nuevo',
          value_minutes: 5,
          detail: 'detalle',
        },
      ],
    };

    const result = metricsFromDTO(dto);

    expect(result.attendanceRadar[0]?.kind).toBe('on_time');
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
