import { useMutation } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { AbsenceCalendarRangeParams } from '../domain/models';

/** Descarga el XLSX (logo de marca, mismo rango que la pantalla) como blob y
 * dispara el "Guardar como" del navegador — igual que
 * `time-clock/application/useExportTimeClockXlsx`, no hay backend de
 * almacenamiento de ficheros que devuelva una URL pública. */
export function useExportAbsenceCalendarXlsx() {
  return useMutation({
    mutationFn: async (params: AbsenceCalendarRangeParams) => {
      const blob = await absencesApiAdapter.exportCalendarXlsx(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calendario-ausencias-${params.dateFrom}_${params.dateTo}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
