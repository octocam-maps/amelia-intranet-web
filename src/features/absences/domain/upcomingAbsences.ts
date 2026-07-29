import { toDateOnly } from './dateOnly';
import type { AbsenceRequest } from './models';

/**
 * "Próximas ausencias" (columna central, debajo del calendario mensual) —
 * ausencias APROBADAS propias que empiezan a partir de `today` (hoy
 * incluido), ordenadas por fecha de inicio ascendente. Deliberadamente una
 * lista y no un segundo calendario: `AbsenceMonthCalendar` ya cubre el mes
 * en curso, un calendario aquí lo duplicaría.
 *
 * `today` debe venir en fecha-only (medianoche, hora local) — igual que
 * devuelve `toDateOnly`.
 */
export function selectUpcomingAbsences(requests: AbsenceRequest[], today: Date): AbsenceRequest[] {
  return requests
    .filter((request) => request.status === 'approved' && toDateOnly(request.startDate) >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
