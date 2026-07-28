import { useMutation } from '@tanstack/react-query';
import { buildCalendarExportFilename } from '../domain/calendarExportFilename';
import type { AbsenceCalendarRangeParams } from '../domain/models';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';

/** RF-A1: `subjectName` es SOLO de presentación (nombre a mostrar en el
 * fichero descargado) — no viaja al backend, que ya resuelve su propio
 * nombre "real" a partir de `userId` (ver `Content-Disposition`, no leído
 * aquí). Lo resuelve quien llama (la página, que ya tiene el directorio
 * cargado para el selector), este hook no hace ninguna consulta extra. */
export type ExportAbsenceCalendarParams = AbsenceCalendarRangeParams & { subjectName?: string };

/** Descarga el XLSX (logo de marca, mismo rango que la pantalla) como blob y
 * dispara el "Guardar como" del navegador — igual que
 * `time-clock/application/useExportTimeClockXlsx`, no hay backend de
 * almacenamiento de ficheros que devuelva una URL pública. */
export function useExportAbsenceCalendarXlsx() {
  return useMutation({
    mutationFn: async (params: ExportAbsenceCalendarParams) => {
      const blob = await absencesApiAdapter.exportCalendarXlsx(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = buildCalendarExportFilename({ ...params, extension: 'xlsx' });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
