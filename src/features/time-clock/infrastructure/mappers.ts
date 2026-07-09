import type { TimeClockCurrentStatus, TimeClockEntry } from '../domain/models';
import type { TimeClockCurrentStatusDTO, TimeClockEntryDTO } from './dtos';

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

export function currentStatusFromDTO(dto: TimeClockCurrentStatusDTO): TimeClockCurrentStatus {
  return {
    openEntry: dto.open_entry
      ? { id: dto.open_entry.id, clockIn: dto.open_entry.clock_in, onBreak: dto.open_entry.on_break }
      : null,
    weekWorkedMinutes: dto.week_worked_minutes,
    expectedWeeklyMinutes: dto.expected_weekly_minutes,
  };
}
