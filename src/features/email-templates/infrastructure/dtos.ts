/** Formas snake_case del backend — contrato verificado contra
 * `amelia-intranet-back/src/features/email_templates/infrastructure/schemas.py`. */

export interface EmailTemplateDTO {
  template_key: string;
  label: string;
  description: string;
  subject: string;
  body_html: string;
  is_active: boolean;
  updated_by: string | null;
  updated_at: string | null;
}

export interface EmailTemplateListDTO {
  templates: EmailTemplateDTO[];
  available_placeholders: string[];
}

export interface EmailTemplatePreviewDTO {
  subject: string;
  html: string;
}
