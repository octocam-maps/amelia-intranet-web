import type { AbsenceBalance, AbsenceRequest, AbsenceType } from '../domain/models';
import type { AbsenceBalanceDTO, AbsenceRequestDTO, AbsenceTypeDTO } from './dtos';

export function typeFromDTO(dto: AbsenceTypeDTO): AbsenceType {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    isPaid: dto.is_paid,
    affectsBalance: dto.affects_balance,
    color: dto.color,
  };
}

export function balanceFromDTO(dto: AbsenceBalanceDTO): AbsenceBalance {
  return {
    absenceTypeId: dto.absence_type_id,
    year: dto.year,
    entitledDays: dto.entitled_days,
    usedDays: dto.used_days,
    pendingDays: dto.pending_days,
    availableDays: dto.available_days,
  };
}

export function requestFromDTO(dto: AbsenceRequestDTO): AbsenceRequest {
  return {
    id: dto.id,
    userId: dto.user_id,
    absenceTypeId: dto.absence_type_id,
    startDate: dto.start_date,
    endDate: dto.end_date,
    daysCount: dto.days_count,
    reason: dto.reason,
    status: dto.status as AbsenceRequest['status'],
    reviewedBy: dto.reviewed_by,
    reviewNote: dto.review_note,
  };
}
