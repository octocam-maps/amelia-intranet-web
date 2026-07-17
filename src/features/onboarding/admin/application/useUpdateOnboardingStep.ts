import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingAdminApiAdapter } from '../infrastructure/onboarding-admin-api.adapter';
import type { UpdateOnboardingStepInput } from '../domain/models';

export function useUpdateOnboardingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, input }: { stepId: string; input: UpdateOnboardingStepInput }) =>
      onboardingAdminApiAdapter.updateStep(stepId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'admin', 'steps'] });
    },
  });
}
