import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';

export function useAcknowledgeManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => onboardingApiAdapter.acknowledgeManual(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] });
    },
  });
}
