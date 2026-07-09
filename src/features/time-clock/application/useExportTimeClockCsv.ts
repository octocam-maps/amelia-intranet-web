import { useMutation } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';
import type { ListTimeClockEntriesParams } from '../domain/models';

/** Descarga el CSV como blob y dispara el "Guardar como" del navegador —
 * no hay backend de almacenamiento de ficheros que devuelva una URL pública. */
export function useExportTimeClockCsv() {
  return useMutation({
    mutationFn: async (params: ListTimeClockEntriesParams) => {
      const blob = await timeClockApiAdapter.exportCsv(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fichaje.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
