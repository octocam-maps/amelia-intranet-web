import { useQuery } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';
import type { ListTimeClockEntriesParams } from '../domain/models';

/** `params` (incluido `limit`/`offset`) entra en la `queryKey` — cambiar de
 * página o de filtro dispara una nueva request, cachea cada página por su
 * propia clave (X1/X2, Lote 1). */
export function useTimeClockEntries(params: ListTimeClockEntriesParams) {
  return useQuery({
    queryKey: ['time-clock', 'entries', params],
    queryFn: () => timeClockApiAdapter.list(params),
    staleTime: 30_000,
  });
}
