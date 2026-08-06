import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';

interface UploadSignedDocumentInput {
  stepId: string;
  file: File;
  /** A cuál de los cuatro documentos del paso 5 corresponde este archivo
   * (migración backend 046). Opcional: con un único documento activo el backend
   * lo resuelve solo, que es lo que hacía el cliente anterior a la 046. */
  documentId?: string;
}

export function useUploadSignedDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, file, documentId }: UploadSignedDocumentInput) =>
      onboardingApiAdapter.uploadSignedDocument(stepId, file, documentId),
    onSuccess: () => {
      // Se invalida siempre, también cuando aún faltan documentos por subir: el
      // paso sigue abierto pero el que se acaba de subir ya viene marcado en
      // `GET /onboarding/me`, y sin refrescar su fila seguiría pidiendo un
      // archivo que ya está entregado.
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] });
    },
  });
}
