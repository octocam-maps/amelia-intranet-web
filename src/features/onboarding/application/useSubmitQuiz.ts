import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';
import type { SubmitQuizInput } from '../domain/models';

export function useSubmitQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, input }: { stepId: string; input: SubmitQuizInput }) =>
      onboardingApiAdapter.submitQuiz(stepId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] });
    },
  });
}
