import { useMutation } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';

/** Descarga el informe XLSX (logo, últimos 30 días) como blob y dispara el
 * "Guardar como" del navegador — igual que `useExportTimeClockCsv`, no hay
 * backend de almacenamiento de ficheros que devuelva una URL pública. El
 * ALCANCE (toda la plantilla vs. solo lo propio) lo decide el backend según
 * el rol del usuario autenticado — este hook no manda `userId`. */
export function useExportTimeClockXlsx() {
  return useMutation({
    mutationFn: async () => {
      const blob = await timeClockApiAdapter.exportXlsx();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fichajes-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
