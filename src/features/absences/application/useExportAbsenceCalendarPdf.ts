import { useMutation } from '@tanstack/react-query';
import { buildCalendarExportFilename } from '../domain/calendarExportFilename';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { ExportAbsenceCalendarParams } from './useExportAbsenceCalendarXlsx';

/** Descarga el PDF (logo de marca, mismo rango que la pantalla) como blob y
 * dispara el "Guardar como" del navegador — mismo patrón que
 * `useExportAbsenceCalendarXlsx`, incluido `subjectName` opcional (RF-A1). */
export function useExportAbsenceCalendarPdf() {
  return useMutation({
    mutationFn: async (params: ExportAbsenceCalendarParams) => {
      const blob = await absencesApiAdapter.exportCalendarPdf(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildCalendarExportFilename({ ...params, extension: 'pdf' });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
