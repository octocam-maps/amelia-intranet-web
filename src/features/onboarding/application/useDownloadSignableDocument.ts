import { useMutation } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';

/** Descarga uno de los documentos a firmar del paso 5, ya rellenado con los
 * datos del perfil, y dispara el "Guardar como" del navegador — mismo patrón que
 * `documents/application/useDownloadDocument`.
 *
 * No es un enlace normal porque el endpoint exige `Authorization`: el PDF lleva
 * dentro nombre, DNI y puesto, así que no puede servirse desde `public/` como los
 * manuales. Hay que traer el blob con la cabecera puesta.
 *
 * El nombre de archivo se arma con el título del documento. El backend manda el
 * suyo en `Content-Disposition`, pero leerlo obligaría a parsear la cabecera y
 * `fetch` no la expone en peticiones cross-origin sin `Access-Control-Expose-
 * Headers`; el título ya está en el cliente y describe igual de bien el fichero. */
export function useDownloadSignableDocument() {
  return useMutation({
    mutationFn: async ({ documentId, title }: { documentId: string; title: string }) => {
      const blob = await onboardingApiAdapter.downloadSignableDocument(documentId);
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
