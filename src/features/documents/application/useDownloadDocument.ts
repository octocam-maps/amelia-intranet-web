import { useMutation } from '@tanstack/react-query';
import { documentsApiAdapter } from '../infrastructure/documents-api.adapter';

/** Descarga el binario como blob y dispara el "Guardar como" del navegador —
 * mismo patrón que `absences/application/useExportAbsenceCalendarPdf`. El
 * nombre de archivo se arma con el título del documento; la extensión
 * asume PDF (único `mime_type` real hoy: default del backend en upload y
 * único tipo que el sync acepta desde Drive). */
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const blob = await documentsApiAdapter.download(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}
