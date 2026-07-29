import { describe, expect, it } from 'vitest';
import type { TeamAbsenceEntry } from '@/features/team/domain/models';
import { selectTeamAbsencesToday, teamAbsenceKindLabel } from './teamAbsencesToday';

const TODAY = new Date(2026, 6, 28); // 28 de julio de 2026

function entry(overrides: Partial<TeamAbsenceEntry> = {}): TeamAbsenceEntry {
  return {
    userId: 'u1',
    fullName: 'Ana García',
    startDate: '2026-07-27',
    endDate: '2026-07-30',
    kind: 'vacaciones',
    ...overrides,
  };
}

describe('selectTeamAbsencesToday', () => {
  it('incluye a quien tiene una ausencia que cubre hoy', () => {
    expect(selectTeamAbsencesToday([entry()], TODAY)).toHaveLength(1);
  });

  it('incluye los bordes: la ausencia que empieza hoy y la que acaba hoy', () => {
    const empiezaHoy = entry({ userId: 'a', startDate: '2026-07-28', endDate: '2026-08-02' });
    const acabaHoy = entry({ userId: 'b', startDate: '2026-07-20', endDate: '2026-07-28' });
    expect(selectTeamAbsencesToday([empiezaHoy, acabaHoy], TODAY)).toHaveLength(2);
  });

  it('excluye lo que ya terminó y lo que aún no ha empezado', () => {
    const pasada = entry({ userId: 'a', startDate: '2026-07-01', endDate: '2026-07-27' });
    const futura = entry({ userId: 'b', startDate: '2026-07-29', endDate: '2026-08-05' });
    expect(selectTeamAbsencesToday([pasada, futura], TODAY)).toEqual([]);
  });

  it('ordena por nombre con criterio español', () => {
    const zoe = entry({ userId: 'z', fullName: 'Zoe Ávila' });
    const ana = entry({ userId: 'a', fullName: 'Ana Índigo' });
    const result = selectTeamAbsencesToday([zoe, ana], TODAY);
    expect(result.map((e) => e.fullName)).toEqual(['Ana Índigo', 'Zoe Ávila']);
  });
});

describe('teamAbsenceKindLabel', () => {
  it('traduce los tres kinds privacy-safe del backend', () => {
    expect(teamAbsenceKindLabel('vacaciones')).toBe('De vacaciones');
    expect(teamAbsenceKindLabel('remoto')).toBe('Teletrabajando');
    expect(teamAbsenceKindLabel('ausente')).toBe('Ausente');
  });

  it('nunca revela un motivo concreto: lo desconocido cae a "Ausente"', () => {
    // Si el backend añadiera un kind nuevo, el fallback NO debe inventar un
    // motivo ni filtrar el tipo real de ausencia.
    expect(teamAbsenceKindLabel('baja_medica' as never)).toBe('Ausente');
  });
});
