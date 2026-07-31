import { useMutation, useQueryClient } from '@tanstack/react-query';
import { emailTemplatesApiAdapter } from '../infrastructure/email-templates-api.adapter';
import type { UpdateEmailTemplateInput } from '../domain/models';

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateKey,
      input,
    }: {
      templateKey: string;
      input: UpdateEmailTemplateInput;
    }) => emailTemplatesApiAdapter.update(templateKey, input),
    onSuccess: () => {
      // Guardar REACTIVA la plantilla en el backend, así que el badge pasa de
      // «Por defecto» a «Editada»: hay que refrescar la lista o el badge miente.
      queryClient.invalidateQueries({ queryKey: ['email-templates', 'list'] });
    },
  });
}
