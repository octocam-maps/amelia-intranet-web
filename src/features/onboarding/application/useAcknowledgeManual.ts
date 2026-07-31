import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';

interface AcknowledgeManualInput {
  stepId: string;
  /** Manual concreto a confirmar (migración backend 040): el paso admite varios
   * en cascada, así que "el manual" ya no identifica nada. */
  documentId: string;
}

export function useAcknowledgeManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, documentId }: AcknowledgeManualInput) =>
      onboardingApiAdapter.acknowledgeManual(stepId, documentId),
    onSuccess: () => {
      // Refresca el paso entero, no solo el manual confirmado: al confirmar uno
      // se desbloquea el siguiente de la cascada, y con el último se completa el
      // paso y se desbloquea el 4. Todo eso lo recalcula el backend.
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] });
    },
  });
}
