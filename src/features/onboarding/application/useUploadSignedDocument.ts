import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApiAdapter } from '../infrastructure/onboarding-api.adapter';

interface UploadSignedDocumentInput {
  stepId: string;
  file: File;
}

export function useUploadSignedDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, file }: UploadSignedDocumentInput) =>
      onboardingApiAdapter.uploadSignedDocument(stepId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', 'me'] });
    },
  });
}
