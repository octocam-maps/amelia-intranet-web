import { useQuery } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { AbsenceCalendarRangeParams } from '../domain/models';

/** "Calendario general de la plantilla" (LOTE 4) — admin-only en el
 * backend; el `queryKey` incluye el rango para que cambiar de mes dispare
 * un nuevo fetch en vez de reutilizar la caché de otro mes. */
export function useAbsenceCalendar(params: AbsenceCalendarRangeParams) {
  return useQuery({
    queryKey: ['absences', 'calendar', params.dateFrom, params.dateTo],
    queryFn: () => absencesApiAdapter.listCalendar(params),
    staleTime: 15_000,
  });
}
