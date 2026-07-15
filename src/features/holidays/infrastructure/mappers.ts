import type { Holiday, HolidayInput, HolidayScope, HolidaySource } from '../domain/models';
import type { HolidayDTO, HolidayInputDTO } from './dtos';

export function holidayFromDTO(dto: HolidayDTO): Holiday {
  return {
    id: dto.id,
    date: dto.day,
    name: dto.name,
    scope: (dto.scope as HolidayScope) ?? null,
    source: dto.source as HolidaySource,
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
