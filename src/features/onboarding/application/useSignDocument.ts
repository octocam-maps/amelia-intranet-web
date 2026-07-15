import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';

export function useSignDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => onboardingApiAdapter.signDocument(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] });
    },
  });
}
