import { parseEnum } from '@/lib/parseEnum';
import type {
  TimeClockBatchOmissionReason,
  TimeClockCurrentStatus,
  TimeClockEntriesBatchResult,
  TimeClockEntry,
  TimeClockEntryNote,
} from '../domain/models';
import type {
  TimeClockCurrentStatusDTO,
  TimeClockEntriesBatchDTO,
  TimeClockEntryDTO,
  TimeClockEntryNoteDTO,
} from './dtos';

// No se renderiza como badge hoy, pero se guarda con el mismo criterio que
// el resto de mappers para no dejar pasar un valor fuera de contrato.
const TIME_CLOCK_SOURCES: TimeClockEntry['source'][] = ['web', 'mobile'];

// RF-A3: motivos de omisión del lote — igual criterio que `TIME_CLOCK_
// SOURCES`, un valor fuera de contrato cae al fallback en vez de reventar
// el renderizado del desglose.
const TIME_CLOCK_BATCH_OMISSION_REASONS: TimeClockBatchOmissionReason[] = [
  'fin_de_semana',
  'festivo',
  'ausencia',
  'ya_registrado',
  'fuera_de_ventana',
];

export function entryFromDTO(dto: TimeClockEntryDTO): TimeClockEntry {
  return {
    id: dto.id,
    userId: dto.user_id,
    fullName: dto.full_name,
    workDate: dto.work_date,
    clockIn: dto.clock_in,
    clockOut: dto.clock_out,
    source: parseEnum(dto.source, TIME_CLOCK_SOURCES, 'web'),
    workedMinutes: dto.worked_minutes,
  };
}

export function batchResultFromDTO(dto: TimeClockEntriesBatchDTO): TimeClockEntriesBatchResult {
  return {
    created: dto.created.map(entryFromDTO),
    omitted: dto.omitted.map((omitted) => ({
      workDate: omitted.work_date,
      reason: parseEnum(omitted.reason, TIME_CLOCK_BATCH_OMISSION_REASONS, 'ya_registrado'),
    })),
  };
}

export function noteFromDTO(dto: TimeClockEntryNoteDTO): TimeClockEntryNote {
  return {
    id: dto.id,
    entryId: dto.entry_id,
    authorId: dto.author_id,
    authorFullName: dto.author_full_name,
    body: dto.body,
    createdAt: dto.created_at,
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
