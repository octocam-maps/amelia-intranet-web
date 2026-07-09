import type { TimeClockEntry } from '../domain/models';
import type { TimeClockEntryDTO } from './dtos';

export function entryFromDTO(dto: TimeClockEntryDTO): TimeClockEntry {
  return {
    id: dto.id,
    userId: dto.user_id,
    workDate: dto.work_date,
    clockIn: dto.clock_in,
    clockOut: dto.clock_out,
    source: dto.source as TimeClockEntry['source'],
    workedMinutes: dto.worked_minutes,
  };
}
