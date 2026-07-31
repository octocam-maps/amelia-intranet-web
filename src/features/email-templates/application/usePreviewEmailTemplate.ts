import { useMutation } from '@tanstack/react-query';
import { emailTemplatesApiAdapter } from '../infrastructure/email-templates-api.adapter';
import type { UpdateEmailTemplateInput } from '../domain/models';

/**
 * Previsualización del BORRADOR. Es una mutación y no una query aunque no escriba
 * nada: se dispara a petición del admin (botón «Previsualizar»), no al montar, y
 * su entrada es el texto que tiene en pantalla — cachearla por clave no tendría
 * sentido porque cambia con cada tecla.
 */
export function usePreviewEmailTemplate() {
  return useMutation({
    mutationFn: ({
      templateKey,
      draft,
    }: {
      templateKey: string;
      draft: Partial<UpdateEmailTemplateInput>;
    }) => emailTemplatesApiAdapter.preview(templateKey, draft),
  });
}
