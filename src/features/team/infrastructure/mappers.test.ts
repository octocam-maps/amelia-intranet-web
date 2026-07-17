import { describe, expect, it } from 'vitest';
import { absenceEntryFromDTO } from './mappers';
import type { TeamAbsenceEntryDTO } from './dtos';

describe('absenceEntryFromDTO', () => {
  it('mapea a camelCase y conserva un kind reconocido', () => {
    const dto: TeamAbsenceEntryDTO = {
      user_id: 'user-1',
      full_name: 'Ana García',
      start_date: '2026-07-20',
      end_date: '2026-07-24',
      kind: 'vacaciones',
    };

    expect(absenceEntryFromDTO(dto)).toEqual({
      userId: 'user-1',
      fullName: 'Ana García',
      startDate: '2026-07-20',
      endDate: '2026-07-24',
      kind: 'vacaciones',
    });
  });

  it('conserva "remoto" tal cual', () => {
    const dto: TeamAbsenceEntryDTO = {
      user_id: 'user-1',
      full_name: 'Ana García',
      start_date: '2026-07-20',
      end_date: '2026-07-24',
      kind: 'remoto',
    };

    expect(absenceEntryFromDTO(dto).kind).toBe('remoto');
  });

  it('cae a "ausente" si el backend manda un kind fuera de contrato', () => {
    // Defensa en profundidad: si por lo que sea llegara un valor crudo de
    // tipo de ausencia (bug de backend, típo `baja_medica` filtrándose),
    // el frontend NUNCA debe propagarlo — colapsa a "ausente" en vez de
    // reventar o mostrar el motivo real.
    const dto: TeamAbsenceEntryDTO = {
      user_id: 'user-1',
      full_name: 'Ana García',
      start_date: '2026-07-20',
      end_date: '2026-07-24',
      kind: 'baja_medica',
    };

    expect(absenceEntryFromDTO(dto).kind).toBe('ausente');
  });
});
