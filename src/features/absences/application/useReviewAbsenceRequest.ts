import { useMutation, useQueryClient } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';
import type { ReviewAbsenceRequestInput } from '../domain/models';

export function useReviewAbsenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      input,
    }: {
      requestId: string;
      input: ReviewAbsenceRequestInput;
    }) => absencesApiAdapter.reviewRequest(requestId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences', 'requests'] });
      queryClient.invalidateQueries({ queryKey: ['absences', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
  });
}
