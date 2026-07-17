import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingAdminApiAdapter } from '../infrastructure/onboarding-admin-api.adapter';

export function useResetQuizAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, userId }: { stepId: string; userId: string }) =>
      onboardingAdminApiAdapter.resetQuizAttempt(stepId, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'admin', 'progress'] });
    },
  });
}
