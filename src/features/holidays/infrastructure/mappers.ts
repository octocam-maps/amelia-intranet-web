import { parseEnum, parseEnumNullable } from '@/lib/parseEnum';
import type { Holiday, HolidayInput, HolidayScope, HolidaySource } from '../domain/models';
import type { HolidayDTO, HolidayInputDTO } from './dtos';

// Ambos se pintan como badge (`SCOPE_LABEL`/`SCOPE_BADGE_VARIANT` en
// HolidaysTable) — un valor fuera de contrato dejaría el badge sin texto/variant.
const HOLIDAY_SCOPES: HolidayScope[] = ['nacional', 'autonomico', 'local', 'empresa'];
const HOLIDAY_SOURCES: HolidaySource[] = ['oficial', 'manual'];

export function holidayFromDTO(dto: HolidayDTO): Holiday {
  return {
    id: dto.id,
    date: dto.day,
    name: dto.name,
    scope: parseEnumNullable(dto.scope, HOLIDAY_SCOPES),
    source: parseEnum(dto.source, HOLIDAY_SOURCES, 'manual'),
  };
}

export function holidayInputToDTO(input: HolidayInput): HolidayInputDTO {
  return {
    day: input.date,
    name: input.name,
    scope: input.scope,
  };
}

export function partialHolidayInputToDTO(input: Partial<HolidayInput>): Partial<HolidayInputDTO> {
  const dto: Partial<HolidayInputDTO> = {};
  if (input.date !== undefined) dto.day = input.date;
  if (input.name !== undefined) dto.name = input.name;
  if (input.scope !== undefined) dto.scope = input.scope;
  return dto;
}
