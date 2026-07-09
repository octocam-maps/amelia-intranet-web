import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';

/** Las 4 acciones del fichaje en vivo comparten la misma invalidación: el
 * estado actual, el historial de tramos y el resumen de Inicio cambian a
 * la vez con cada fichar/pausar. */
function useLiveClockMutation(mutationFn: () => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-clock', 'current'] });
      queryClient.invalidateQueries({ queryKey: ['time-clock', 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}

export function useClockIn() {
  return useLiveClockMutation(() => timeClockApiAdapter.clockIn());
}

export function useClockOut() {
  return useLiveClockMutation(() => timeClockApiAdapter.clockOut());
}

export function useStartBreak() {
  return useLiveClockMutation(() => timeClockApiAdapter.startBreak());
}

export function useEndBreak() {
  return useLiveClockMutation(() => timeClockApiAdapter.endBreak());
}
