export interface AbsenceType {
  id: string;
  code: string;
  name: string;
  isPaid: boolean;
  affectsBalance: boolean;
  color: string | null;
  /** Campos de administración — deck-fase6/15-tipos-ausencia.png. Solo el
   * admin los edita (`AbsenceTypeFormDialog`); el resto de la app (dropdown
   * de solicitud, balance) los ignora y sigue usando los campos de arriba. */
  requiresApproval: boolean;
  requiresJustification: boolean;
  maxDaysPerYear: number | null;
  isActive: boolean;
}

export interface AbsenceTypeInput {
  name: string;
  color: string | null;
  affectsBalance: boolean;
  requiresApproval: boolean;
  requiresJustification: boolean;
  maxDaysPerYear: number | null;
  isActive: boolean;
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
  /** Solo relleno en `mode: 'pending' | 'all'` (el backend hace JOIN con
   * `users`) — en `mode: 'own'` viene `null` porque no hace falta. */
  userFullName: string | null;
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
