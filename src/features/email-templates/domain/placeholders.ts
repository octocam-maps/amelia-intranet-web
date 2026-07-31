/**
 * Traducción entre lo que ESCRIBE el admin y lo que se GUARDA.
 *
 * El backend sustituye `{{full_name}}` al enviar — esa es su sintaxis y su lista
 * blanca (`render_placeholders`). Pero `{{full_name}}` en un textarea sigue siendo
 * código: dobles llaves, guiones bajos y el campo en inglés. Una persona de RRHH
 * no tiene por qué saber que las llaves van dobles, y si escribe `{full_name}` con
 * una sola, el correo sale con el placeholder literal.
 *
 * Así que en pantalla se ve `[Nombre de la persona]` y al guardar se traduce a
 * `{{full_name}}`. La sintaxis técnica no sale nunca del navegador.
 *
 * POR QUÉ CORCHETES: es lo que ya se usa para "rellena aquí" en cualquier
 * plantilla de documento, y aparece muy poco en prosa. Un corchete suelto que el
 * admin escriba en su texto no se toca: solo se traducen los nombres EXACTOS de la
 * lista, así que "[importante]" se queda como está.
 */

/** Nombre legible de cada campo que el backend admite.
 *
 * Las etiquetas tienen que ser ÚNICAS: la traducción es bidireccional y dos campos
 * con el mismo nombre harían ambigua la vuelta. */
export const PLACEHOLDER_LABEL: Record<string, string> = {
  full_name: 'Nombre de la persona',
  job_title: 'Puesto',
  entity_name: 'Sociedad',
  title: 'Título del aviso',
  body: 'Texto del aviso',
  url: 'Enlace a la intranet',
};

/** `full_name` → `[Nombre de la persona]`, para insertar desde los botones. */
export function placeholderToken(field: string): string {
  return `[${PLACEHOLDER_LABEL[field] ?? field}]`;
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Lo guardado → lo que se muestra. `{{full_name}}` → `[Nombre de la persona]`.
 *
 * Un campo que el backend mande y no esté en la lista se deja con su sintaxis
 * original: es preferible que el admin vea `{{campo_nuevo}}` —raro pero
 * funcional— a que desaparezca del textarea y se pierda al guardar.
 */
export function toDisplay(stored: string): string {
  return stored.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, field: string) =>
    PLACEHOLDER_LABEL[field] ? `[${PLACEHOLDER_LABEL[field]}]` : match
  );
}

/**
 * Lo que se muestra → lo guardado. `[Nombre de la persona]` → `{{full_name}}`.
 *
 * Solo traduce las etiquetas EXACTAS de la lista. Cualquier otro corchete es texto
 * del admin y se respeta — si escribe "[pendiente]", eso llega al correo tal cual.
 *
 * También respeta un `{{campo}}` que ya viniera escrito, para no romper una
 * plantilla que alguien haya editado por API o directamente en la BD.
 */
export function toStorage(displayed: string): string {
  let result = displayed;
  for (const [field, label] of Object.entries(PLACEHOLDER_LABEL)) {
    result = result.replace(
      new RegExp(`\\[${escapeForRegExp(label)}\\]`, 'g'),
      `{{${field}}}`
    );
  }
  return result;
}
