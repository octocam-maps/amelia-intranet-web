import { useQuery } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { AbsenceCalendarRangeParams } from '../domain/models';

/** "Calendario general de la plantilla" (LOTE 4) — admin-only en el
 * backend; el `queryKey` incluye el rango para que cambiar de mes dispare
 * un nuevo fetch en vez de reutilizar la caché de otro mes.
 *
 * `userId` va TAMBIÉN en el `queryKey`, no solo en la petición: con el key
 * anterior (solo el rango), elegir un empleado pedía el calendario filtrado
 * pero React Query servía la respuesta global ya cacheada del mismo mes — la
 * grilla seguía mostrando a toda la plantilla y el filtro parecía roto. */
export function useAbsenceCalendar(params: AbsenceCalendarRangeParams) {
  return useQuery({
    queryKey: ['absences', 'calendar', params.dateFrom, params.dateTo, params.userId ?? null],
    queryFn: () => absencesApiAdapter.listCalendar(params),
    staleTime: 15_000,
  });
}
