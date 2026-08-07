import { parseEnum } from '@/lib/parseEnum';
import type {
  CompensationBalance,
  OvernightStay,
  ProductCategory,
  TechnicianDailyLog,
  TechnicianMonthPage,
  TechnicianMonthSummary,
  TimeClockBatchOmissionReason,
  TimeClockCurrentStatus,
  TimeClockEntriesBatchResult,
  TimeClockEntry,
  TimeClockEntryNote,
} from '../domain/models';
import type {
  CompensationBalanceDTO,
  TechnicianDailyLogDTO,
  TechnicianDailyLogListDTO,
  TechnicianMonthSummaryDTO,
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

// --- Parte diario del técnico (requerimiento v1.2 §M1) ---

// Ambos se renderizan como etiqueta visible ("España" / "Fuera de España",
// "Software" / "Hardware"), así que van por `parseEnum`: un valor fuera de
// contrato pintaría una celda en blanco en el parte, y eso en una tabla de
// jornadas no se distingue de "no hubo pernocta".
const OVERNIGHT_STAYS: OvernightStay[] = ['ninguna', 'espana', 'extranjero'];
const PRODUCT_CATEGORIES: ProductCategory[] = ['software', 'hardware'];

export function technicianLogFromDTO(dto: TechnicianDailyLogDTO): TechnicianDailyLog {
  return {
    entryId: dto.entry_id,
    userId: dto.user_id,
    fullName: dto.full_name,
    workDate: dto.work_date,
    startedAt: dto.started_at,
    endedAt: dto.ended_at,
    projectId: dto.project_id,
    projectName: dto.project_name,
    workLocation: dto.work_location,
    hadBreak: dto.had_break,
    breakMinutes: dto.break_minutes,
    overnightStay: parseEnum(dto.overnight_stay, OVERNIGHT_STAYS, 'ninguna'),
    productCategory: parseEnum(dto.product_category, PRODUCT_CATEGORIES, 'software'),
    workedMinutes: dto.worked_minutes,
  };
}

export function technicianMonthSummaryFromDTO(
  dto: TechnicianMonthSummaryDTO,
): TechnicianMonthSummary {
  return {
    year: dto.year,
    month: dto.month,
    budgetMinutes: dto.budget_minutes,
    workedMinutes: dto.worked_minutes,
    remainingMinutes: dto.remaining_minutes,
    overtimeMinutes: dto.overtime_minutes,
    compensationMinutes: dto.compensation_minutes,
    overnightStaysSpain: dto.overnight_stays_spain,
    overnightStaysAbroad: dto.overnight_stays_abroad,
    overnightStaysTotal: dto.overnight_stays_total,
    isClosed: dto.is_closed,
  };
}

export function technicianMonthFromDTO(dto: TechnicianDailyLogListDTO): TechnicianMonthPage {
  return {
    logs: dto.logs.map(technicianLogFromDTO),
    summary: technicianMonthSummaryFromDTO(dto.summary),
  };
}

export function compensationBalanceFromDTO(dto: CompensationBalanceDTO): CompensationBalance {
  return {
    year: dto.year,
    accruedMinutes: dto.accrued_minutes,
    consumedMinutes: dto.consumed_minutes,
    availableMinutes: dto.available_minutes,
    pendingMinutes: dto.pending_minutes,
  };
}
