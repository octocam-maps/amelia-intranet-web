import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';
import type { CompleteProfileInput } from '../domain/models';

export function useCompleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, input }: { stepId: string; input: CompleteProfileInput }) =>
      onboardingApiAdapter.completeProfile(stepId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] });
    },
  });
}
