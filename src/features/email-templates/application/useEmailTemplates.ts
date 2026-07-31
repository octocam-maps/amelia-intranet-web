import { useQuery } from '@tanstack/react-query';
import { emailTemplatesApiAdapter } from '../infrastructure/email-templates-api.adapter';

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates', 'list'],
    queryFn: () => emailTemplatesApiAdapter.list(),
    // Solo cambia cuando el admin edita una plantilla, y en ese caso la mutación
    // invalida esta clave. Refetchear cada 30 s sería ruido.
    staleTime: 5 * 60_000,
  });
}
