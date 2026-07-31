/**
 * Plantillas de los correos automáticos (`email_templates`, migración backend
 * 041). El catálogo es CERRADO: lo siembra la migración con los tipos de correo
 * que el backend sabe enviar, así que no hay "crear" ni "borrar" — una fila nueva
 * no haría aparecer un correo nuevo.
 */
export interface EmailTemplate {
  templateKey: string;
  /** Nombre legible para la lista. El admin busca «Bienvenida», no
   * `staff_invited`. */
  label: string;
  /** Cuándo se manda este correo. Sin esto, el admin tendría que adivinar qué
   * dispara `clock_out_missing`. */
  description: string;
  subject: string;
  /** Cuerpo en TEXTO PLANO. El admin NO escribe HTML: una línea en blanco
   * separa párrafos, `**texto**` es negrita y las URLs se enlazan solas. El HTML
   * lo genera el backend (`plain_text_to_html`), que además escapa esto — así una
   * etiqueta mal escrita no puede romper el correo de toda la plantilla. */
  body: string;
  /** `false` = está usando el texto por defecto del código. Se pinta como «Por
   * defecto» frente a «Editada»: es la distinción que el admin necesita para
   * saber qué ha tocado. */
  isActive: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface EmailTemplateList {
  templates: EmailTemplate[];
  /** Placeholders admitidos, servidos por el BACKEND. No se duplican aquí: la
   * lista blanca real vive en `render_placeholders`, y una copia en el cliente se
   * habría desincronizado en el primer placeholder que se añadiera. */
  availablePlaceholders: string[];
}

export interface UpdateEmailTemplateInput {
  subject: string;
  /** Texto plano, sin etiquetas. */
  body: string;
}

/** Resultado de la previsualización: el correo COMPLETO con su marco (logo, botón
 * y pie), no solo el cuerpo — para que se vea lo que va a recibir el
 * destinatario, no una aproximación. */
export interface EmailTemplatePreview {
  subject: string;
  html: string;
}
