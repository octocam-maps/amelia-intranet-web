import { useQuery } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';

/** Estado en vivo (tramo abierto + acumulado semanal) — refresco corto para
 * que el pill del topbar y la tarjeta de Inicio no se queden desfasados
 * tras fichar entrada/salida desde otra pestaña o el móvil. */
export function useTimeClockCurrent() {
  return useQuery({
    queryKey: ['time-clock', 'current'],
    queryFn: () => timeClockApiAdapter.getCurrent(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
