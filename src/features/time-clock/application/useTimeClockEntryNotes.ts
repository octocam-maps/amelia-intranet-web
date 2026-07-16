import { useQuery } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';

/** `entryId` puede llegar `undefined` (diálogo cerrado, sin tramo
 * seleccionado todavía) — `enabled` evita disparar la request hasta que
 * haya un tramo real que consultar. */
export function useTimeClockEntryNotes(entryId: string | undefined) {
  return useQuery({
    queryKey: ['time-clock', 'entry-notes', entryId],
    queryFn: () => timeClockApiAdapter.listNotes(entryId as string),
    enabled: Boolean(entryId),
    staleTime: 15_000,
  });
}
