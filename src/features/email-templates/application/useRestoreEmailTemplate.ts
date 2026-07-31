import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emailTemplatesApiAdapter } from '../infrastructure/email-templates-api.adapter';

export function useRestoreEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateKey: string) => emailTemplatesApiAdapter.restore(templateKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates', 'list'] });
    },
  });
}
