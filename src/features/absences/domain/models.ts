export interface AbsenceType {
  id: string;
  code: string;
  name: string;
  isPaid: boolean;
  affectsBalance: boolean;
  color: string | null;
}

/** Contador en tiempo real por tipo/año — se recalcula en el backend en
 * cada alta/aprobación/rechazo, nunca en el cliente. */
export interface AbsenceBalance {
  absenceTypeId: string;
  year: number;
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
}

export type AbsenceRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface AbsenceRequest {
  id: string;
  userId: string;
  absenceTypeId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string | null;
  status: AbsenceRequestStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
}

export interface CreateAbsenceRequestInput {
  absenceTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export type AbsenceReviewDecision = 'approved' | 'rejected';

export interface ReviewAbsenceRequestInput {
  decision: AbsenceReviewDecision;
  note?: string;
}

/** `own`: propias (o las de `userId` si el admin lo pasa) · `pending`: bandeja
 * de aprobación (solo admin) · `all`: calendario global (solo admin). */
export type ListAbsenceRequestsMode = 'own' | 'pending' | 'all';
