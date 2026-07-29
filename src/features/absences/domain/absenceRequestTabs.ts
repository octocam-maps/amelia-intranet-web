import { toDateOnly } from './dateOnly';
import type { AbsenceRequest } from './models';

export type AbsenceRequestTab = 'approved' | 'pending' | 'past';

/**
 * "Mis solicitudes" (columna izquierda, deck 03-ausencias-empleado) — 3
 * pestañas sobre la misma lista de `AbsenceRequest` propias ya cargada por
 * `useAbsenceRequests({ mode: 'own' })`, sin volver a pedir nada al backend.
 *
 * Prioridad: si el periodo YA TERMINÓ (`endDate` < `today`), la solicitud va
 * siempre a "past", sea cual sea su estado — incluida una `pending` que
 * quedó vencida sin resolver. Solo cuando el periodo no ha terminado se
 * distingue entre "approved"/"pending" por estado. `rejected`/`cancelled`
 * van a "past" sin mirar la fecha.
 *
 * `today` debe venir en fecha-only (medianoche, hora local) — igual que
 * devuelve `toDateOnly`.
 */
export function categorizeAbsenceRequestsByTab(
  requests: AbsenceRequest[],
  today: Date
): Record<AbsenceRequestTab, AbsenceRequest[]> {
  const tabs: Record<AbsenceRequestTab, AbsenceRequest[]> = {
    approved: [],
    pending: [],
    past: [],
  };

  for (const request of requests) {
    const hasEnded = toDateOnly(request.endDate) < today;
    if (hasEnded || request.status === 'rejected' || request.status === 'cancelled') {
      tabs.past.push(request);
    } else if (request.status === 'approved') {
      tabs.approved.push(request);
    } else if (request.status === 'pending') {
      tabs.pending.push(request);
    }
  }

  return tabs;
}
