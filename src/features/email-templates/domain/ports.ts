import type {
  EmailTemplate,
  EmailTemplateList,
  EmailTemplatePreview,
  UpdateEmailTemplateInput,
} from './models';

export interface EmailTemplateRepository {
  list(): Promise<EmailTemplateList>;
  update(templateKey: string, input: UpdateEmailTemplateInput): Promise<EmailTemplate>;
  /** Vuelve al texto por defecto del código sin perder lo que el admin escribió. */
  restore(templateKey: string): Promise<EmailTemplate>;
  /** Renderiza el BORRADOR (lo que hay en pantalla, no lo guardado) con datos de
   * ejemplo. No guarda ni envía. */
  preview(
    templateKey: string,
    draft: Partial<UpdateEmailTemplateInput>
  ): Promise<EmailTemplatePreview>;
}
