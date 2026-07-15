import type { AbsenceBalance, AbsenceRequest, AbsenceType, AbsenceTypeInput } from '../domain/models';
import type { AbsenceBalanceDTO, AbsenceRequestDTO, AbsenceTypeDTO, AbsenceTypeInputDTO } from './dtos';

export function typeFromDTO(dto: AbsenceTypeDTO): AbsenceType {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    isPaid: dto.is_paid,
    affectsBalance: dto.affects_balance,
    color: dto.color,
    requiresApproval: dto.requires_approval,
    requiresJustification: dto.requires_justification,
    maxDaysPerYear: dto.max_days_per_year,
    isActive: dto.is_active,
  };
}

export function absenceTypeInputToDTO(input: AbsenceTypeInput): AbsenceTypeInputDTO {
  return {
    name: input.name,
    color: input.color,
    affects_balance: input.affectsBalance,
    requires_approval: input.requiresApproval,
    requires_justification: input.requiresJustification,
    max_days_per_year: input.maxDaysPerYear,
    is_active: input.isActive,
  };
}

export function partialAbsenceTypeInputToDTO(input: Partial<AbsenceTypeInput>): Partial<AbsenceTypeInputDTO> {
  const dto: Partial<AbsenceTypeInputDTO> = {};
  if (input.name !== undefined) dto.name = input.name;
  if (input.color !== undefined) dto.color = input.color;
  if (input.affectsBalance !== undefined) dto.affects_balance = input.affectsBalance;
  if (input.requiresApproval !== undefined) dto.requires_approval = input.requiresApproval;
  if (input.requiresJustification !== undefined) dto.requires_justification = input.requiresJustification;
  if (input.maxDaysPerYear !== undefined) dto.max_days_per_year = input.maxDaysPerYear;
  if (input.isActive !== undefined) dto.is_active = input.isActive;
  return dto;
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
    userFullName: dto.user_full_name,
  };
}
