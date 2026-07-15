import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';

/**
 * Se llama cada ~5s durante la reproducción — invalidar `['onboarding','me']`
 * en CADA report reharía el fetch de la página entera decenas de veces por
 * vídeo. Solo invalidamos cuando el backend confirma que el paso pasó a
 * `completed` (desbloquea el paso 2); los reports intermedios solo mueven la
 * barra de progreso, que VideoStep ya lleva en estado local.
 */
export function useReportVideoProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, progressPct }: { stepId: string; progressPct: number }) =>
      onboardingApiAdapter.reportVideoProgress(stepId, { progressPct }),
    onSuccess: (result) => {
      if (result.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] });
      }
    },
  });
}
