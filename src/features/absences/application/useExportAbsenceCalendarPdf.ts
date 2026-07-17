import { useMutation } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { AbsenceCalendarRangeParams } from '../domain/models';

/** Descarga el PDF (logo de marca, mismo rango que la pantalla) como blob y
 * dispara el "Guardar como" del navegador — mismo patrón que
 * `useExportAbsenceCalendarXlsx`. */
export function useExportAbsenceCalendarPdf() {
  return useMutation({
    mutationFn: async (params: AbsenceCalendarRangeParams) => {
      const blob = await absencesApiAdapter.exportCalendarPdf(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calendario-ausencias-${params.dateFrom}_${params.dateTo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
