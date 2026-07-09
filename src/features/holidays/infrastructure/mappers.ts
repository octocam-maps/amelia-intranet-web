import type { Holiday, HolidayInput, HolidayScope } from '../domain/models';
import type { HolidayDTO, HolidayInputDTO } from './dtos';

export function holidayFromDTO(dto: HolidayDTO): Holiday {
  return {
    id: dto.id,
    date: dto.date,
    name: dto.name,
    scope: dto.scope as HolidayScope,
  };
}

export function holidayInputToDTO(input: HolidayInput): HolidayInputDTO {
  return {
    date: input.date,
    name: input.name,
    scope: input.scope,
  };
}

export function partialHolidayInputToDTO(input: Partial<HolidayInput>): Partial<HolidayInputDTO> {
  const dto: Partial<HolidayInputDTO> = {};
  if (input.date !== undefined) dto.date = input.date;
  if (input.name !== undefined) dto.name = input.name;
  if (input.scope !== undefined) dto.scope = input.scope;
  return dto;
}
