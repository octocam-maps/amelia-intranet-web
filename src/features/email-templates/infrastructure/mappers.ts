import type { EmailTemplate, EmailTemplateList, EmailTemplatePreview } from '../domain/models';
import type {
  EmailTemplateDTO,
  EmailTemplateListDTO,
  EmailTemplatePreviewDTO,
} from './dtos';

export function emailTemplateFromDTO(dto: EmailTemplateDTO): EmailTemplate {
  return {
    templateKey: dto.template_key,
    label: dto.label,
    description: dto.description,
    subject: dto.subject,
    bodyHtml: dto.body_html,
    isActive: dto.is_active,
    updatedBy: dto.updated_by,
    updatedAt: dto.updated_at,
  };
}

export function emailTemplateListFromDTO(dto: EmailTemplateListDTO): EmailTemplateList {
  return {
    templates: dto.templates.map(emailTemplateFromDTO),
    availablePlaceholders: dto.available_placeholders,
  };
}

export function emailTemplatePreviewFromDTO(
  dto: EmailTemplatePreviewDTO
): EmailTemplatePreview {
  return { subject: dto.subject, html: dto.html };
}
