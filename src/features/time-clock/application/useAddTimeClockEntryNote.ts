import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';
import type { AddTimeClockEntryNoteInput } from '../domain/models';

export function useAddTimeClockEntryNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: AddTimeClockEntryNoteInput }) =>
      timeClockApiAdapter.addNote(entryId, input),
    onSuccess: (_note, { entryId }) => {
      // El INSERT no resuelve `authorFullName` (sin JOIN) — se refresca el
      // listado para pintar la incidencia con el nombre completo.
      queryClient.invalidateQueries({ queryKey: ['time-clock', 'entry-notes', entryId] });
    },
  });
}
