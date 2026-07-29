import { describe, expect, it } from 'vitest';
import { USER_ROLES } from '@/features/auth/domain/models';
import {
  createStaffMemberInputToDTO,
  staffMemberFromDTO,
  updateStaffMemberInputToDTO,
} from './mappers';
import type { CreateStaffMemberInput, UpdateStaffMemberInput } from '../domain/models';
import type { StaffMemberDTO } from './dtos';

function baseDTO(overrides: Partial<StaffMemberDTO> = {}): StaffMemberDTO {
  return {
    id: 'user-1',
    full_name: 'David Ferre',
    email: 'david@ameliahub.com',
    avatar_url: null,
    job_title: 'Socio fundador',
    contract_type: null,
    department_id: null,
    department_name: null,
    entity_id: null,
    entity_code: null,
    role_id: 'role-1',
    role_code: 'empleado',
    status: 'active',
    hire_date: null,
    vacation_days_per_year: null,
    vacation_days_override: null,
    vacation_days_calculated: 0,
    ...overrides,
  };
}

describe('staffMemberFromDTO', () => {
  it.each(USER_ROLES)('mapea el rol "%s" sin degradarlo (fuente única USER_ROLES)', (role) => {
    const member = staffMemberFromDTO(baseDTO({ role_code: role }));

    expect(member.role).toBe(role);
  });

  it('cae a "empleado" si el backend manda un role_code fuera de contrato', () => {
    const member = staffMemberFromDTO(baseDTO({ role_code: 'rol_que_no_existe' }));

    expect(member.role).toBe('empleado');
  });

  it('mapea contract_type null como null, no como "full_time" (fallback inventado)', () => {
    const member = staffMemberFromDTO(baseDTO({ contract_type: null }));

    expect(member.contractType).toBeNull();
  });

  it.each(['full_time', 'part_time', 'intern'] as const)(
    'mapea el tipo de contrato "%s" sin degradarlo',
    (contractType) => {
      const member = staffMemberFromDTO(baseDTO({ contract_type: contractType }));

      expect(member.contractType).toBe(contractType);
    }
  );

  it('un contract_type fuera de contrato colapsa a null, no a un fallback inventado', () => {
    // `as any` porque el DTO tipa `contract_type` como `string | null` — el
    // backend no manda un enum real, y en runtime nada impide que llegue un
    // valor fuera del `CHECK` (una migración a medias, un valor nuevo en el
    // backend antes que en el frontend).
    const member = staffMemberFromDTO(baseDTO({ contract_type: 'becario_freelance' as never }));

    expect(member.contractType).toBeNull();
  });
});

describe('createStaffMemberInputToDTO', () => {
  function baseInput(overrides: Partial<CreateStaffMemberInput> = {}): CreateStaffMemberInput {
    return {
      fullName: 'David Ferre',
      email: 'david@ameliahub.com',
      entityCode: 'hub',
      role: 'empleado',
      ...overrides,
    };
  }

  it('manda contract_type null cuando el alta no especifica ninguno', () => {
    const dto = createStaffMemberInputToDTO(baseInput());

    expect(dto.contract_type).toBeNull();
  });

  it('manda el tipo de contrato elegido en el alta', () => {
    const dto = createStaffMemberInputToDTO(baseInput({ contractType: 'intern' }));

    expect(dto.contract_type).toBe('intern');
  });
});

describe('updateStaffMemberInputToDTO — contract_type de tres estados', () => {
  it('NO incluye la clave contract_type si el input no la trae (no tocar)', () => {
    const dto = updateStaffMemberInputToDTO({} as UpdateStaffMemberInput);

    expect('contract_type' in dto).toBe(false);
  });

  it('incluye contract_type: null explícito cuando el input lo vacía (vuelve a "sin especificar")', () => {
    const dto = updateStaffMemberInputToDTO({ contractType: null });

    expect(dto.contract_type).toBeNull();
  });

  it('incluye el tipo de contrato cuando el input fija uno', () => {
    const dto = updateStaffMemberInputToDTO({ contractType: 'part_time' });

    expect(dto.contract_type).toBe('part_time');
  });
});
