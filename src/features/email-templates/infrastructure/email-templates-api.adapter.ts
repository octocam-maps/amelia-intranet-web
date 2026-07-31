import { apiClient } from '@/lib/http/api-client';
import type {
  EmailTemplate,
  EmailTemplateList,
  EmailTemplatePreview,
  UpdateEmailTemplateInput,
} from '../domain/models';
import type { EmailTemplateRepository } from '../domain/ports';
import type {
  EmailTemplateDTO,
  EmailTemplateListDTO,
  EmailTemplatePreviewDTO,
} from './dtos';
import {
  emailTemplateFromDTO,
  emailTemplateListFromDTO,
  emailTemplatePreviewFromDTO,
} from './mappers';

export const emailTemplatesApiAdapter: EmailTemplateRepository = {
  async list(): Promise<EmailTemplateList> {
    const dto = await apiClient<EmailTemplateListDTO>('/email-templates');
    return emailTemplateListFromDTO(dto);
  },

  async update(templateKey, input: UpdateEmailTemplateInput): Promise<EmailTemplate> {
    const dto = await apiClient<EmailTemplateDTO>(`/email-templates/${templateKey}`, {
      method: 'PATCH',
      body: JSON.stringify({ subject: input.subject, body_html: input.bodyHtml }),
    });
    return emailTemplateFromDTO(dto);
  },

  async restore(templateKey): Promise<EmailTemplate> {
    const dto = await apiClient<EmailTemplateDTO>(
      `/email-templates/${templateKey}/restore`,
      { method: 'POST' }
    );
    return emailTemplateFromDTO(dto);
  },

  async preview(templateKey, draft): Promise<EmailTemplatePreview> {
    // POST y no GET aunque no escriba nada: el borrador va en el cuerpo, y un
    // HTML en la query string se topa con el límite de longitud de URL y queda
    // en los logs de acceso.
    const dto = await apiClient<EmailTemplatePreviewDTO>(
      `/email-templates/${templateKey}/preview`,
      {
        method: 'POST',
        body: JSON.stringify({
          subject: draft.subject ?? null,
          body_html: draft.bodyHtml ?? null,
        }),
      }
    );
    return emailTemplatePreviewFromDTO(dto);
  },
};
