import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { usePreviewEmailTemplate } from '../application/usePreviewEmailTemplate';
import { useRestoreEmailTemplate } from '../application/useRestoreEmailTemplate';
import { useUpdateEmailTemplate } from '../application/useUpdateEmailTemplate';
import type { EmailTemplate } from '../domain/models';
import {
  PLACEHOLDER_LABEL,
  placeholderToken,
  toDisplay,
  toStorage,
} from '../domain/placeholders';
import styles from './EmailTemplateEditor.module.css';

interface EmailTemplateEditorProps {
  template: EmailTemplate;
  availablePlaceholders: string[];
}

/**
 * Editor de una plantilla de correo. Solo asunto y cuerpo: el MARCO del email
 * (cabecera con logo, botón y pie) lo pone el backend y no se expone — si el
 * admin pudiera editar el HTML completo, un guardado mal hecho dejaría a toda la
 * plantilla sin logo y nadie lo vería hasta que llegara a las bandejas.
 *
 * El borrador vive en estado local y se REINICIA POR REMONTE: la página le pasa
 * una `key` que incluye `updatedAt`/`isActive` (ver `EmailTemplatesPage`). La
 * alternativa —un `useEffect` que copiara las props al estado— tenía que omitir
 * `template.subject` de las dependencias para no pisar lo que el admin está
 * escribiendo en cada refetch, y eso es exactamente el `exhaustive-deps` que
 * avisa de un bug. Con `key`, React reinicia el estado y no hay nada que
 * sincronizar a mano.
 */
export function EmailTemplateEditor({ template, availablePlaceholders }: EmailTemplateEditorProps) {
  // El estado guarda lo que el admin VE (`[Nombre de la persona]`), y se traduce a
  // la sintaxis del backend (`{{full_name}}`) justo al guardar o previsualizar. La
  // sintaxis técnica no sale nunca del navegador.
  const [subject, setSubject] = useState(() => toDisplay(template.subject));
  const [body, setBody] = useState(() => toDisplay(template.body));
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  /** Inserta el campo donde está el cursor. Los chips eran solo informativos y
   * eso obligaba a copiarlos a mano con las llaves exactas — el error más
   * probable de todos (`{full_name}` con una llave, o mal escrito) y el que deja
   * el placeholder literal en el correo.
   *
   * SOLO usa la posición del cursor si el textarea tiene el FOCO. Sin esa
   * comprobación, un textarea sin tocar reporta `selectionStart = 0` y el campo
   * se colaba al PRINCIPIO del texto: pulsar «Nombre de la persona» sobre
   * "Hola " daba "{{full_name}}Hola ". Lo cazó un test, y pasa en el uso más
   * normal de todos — abrir la plantilla y pulsar un chip sin haber escrito. */
  function insertPlaceholder(placeholder: string) {
    const token = placeholderToken(placeholder);
    const el = bodyRef.current;
    const hasCursor = el !== null && document.activeElement === el;

    if (!hasCursor) {
      // Sin cursor, al final: es donde el admin espera que aparezca.
      setBody((current) => `${current}${token}`);
      return;
    }

    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(`${body.slice(0, start)}${token}${body.slice(end)}`);
    // Deja el cursor detrás de lo insertado, para poder seguir escribiendo.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const { mutate: save, isPending: isSaving, error: saveError } = useUpdateEmailTemplate();
  const { mutate: restore, isPending: isRestoring } = useRestoreEmailTemplate();
  const { mutate: preview, data: previewResult, isPending: isPreviewing } =
    usePreviewEmailTemplate();

  // Se compara en el mismo espacio (lo mostrado), o una plantilla recién abierta
  // saldría como "modificada" solo por la traducción de los campos.
  const isDirty =
    subject !== toDisplay(template.subject) || body !== toDisplay(template.body);
  const canSave = subject.trim().length > 0 && body.trim().length > 0 && isDirty;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <p className={styles.label}>{template.label}</p>
          <p className={styles.description}>{template.description}</p>
        </div>
        <span className={template.isActive ? styles.badgeEdited : styles.badgeDefault}>
          {template.isActive ? 'Editada' : 'Texto por defecto'}
        </span>
      </div>

      <div className={styles.field}>
        <Label htmlFor={`subject-${template.templateKey}`}>Asunto</Label>
        <Input
          id={`subject-${template.templateKey}`}
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <Label htmlFor={`body-${template.templateKey}`}>Cuerpo del mensaje</Label>
        <textarea
          id={`body-${template.templateKey}`}
          ref={bodyRef}
          className={styles.textarea}
          rows={8}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <p className={styles.hint}>
          Escribe el texto tal cual, sin etiquetas. Deja una <strong>línea en blanco</strong> para
          empezar un párrafo nuevo y escribe <code>**así**</code> lo que quieras en negrita. Las
          direcciones web y los correos se convierten en enlaces solos. El logo, el botón y el pie
          los pone la intranet.
        </p>
      </div>

      <div className={styles.placeholders}>
        <p className={styles.hint}>
          Pulsa un campo para insertarlo. Aparecerá <strong>entre corchetes</strong> y al enviar
          se sustituye por el dato real de cada persona:
        </p>
        <div className={styles.chips}>
          {/* La lista la manda el BACKEND: es la misma lista blanca que aplica al
              renderizar, así que la ayuda no puede quedarse desincronizada. */}
          {availablePlaceholders.map((placeholder) => (
            <button
              key={placeholder}
              type="button"
              className={styles.chip}
              onClick={() => insertPlaceholder(placeholder)}
              title={`Insertar ${PLACEHOLDER_LABEL[placeholder] ?? placeholder}`}
            >
              {PLACEHOLDER_LABEL[placeholder] ?? placeholder}
            </button>
          ))}
        </div>
      </div>

      {saveError && (
        <p className={styles.error}>
          {saveError instanceof Error ? saveError.message : 'No se pudo guardar la plantilla.'}
        </p>
      )}

      <div className={styles.actions}>
        <Button
          variant="outline"
          disabled={isPreviewing}
          onClick={() =>
            preview({
              templateKey: template.templateKey,
              draft: { subject: toStorage(subject), body: toStorage(body) },
            })
          }
        >
          {isPreviewing ? 'Generando…' : 'Previsualizar'}
        </Button>
        {/* Solo se ofrece restaurar si hay algo que restaurar: en una plantilla
            que ya usa el texto por defecto, el botón no haría nada. */}
        {template.isActive && (
          <Button
            variant="outline"
            disabled={isRestoring}
            onClick={() => {
              const confirmed = window.confirm(
                `¿Restaurar el texto por defecto de «${template.label}»?\n\n` +
                  'Se dejará de usar tu versión en los correos, pero no se borra: ' +
                  'puedes volver a ella guardándola de nuevo.'
              );
              if (confirmed) restore(template.templateKey);
            }}
          >
            Restaurar por defecto
          </Button>
        )}
        <Button
          variant="dark"
          disabled={!canSave || isSaving}
          onClick={() =>
            save({
              templateKey: template.templateKey,
              input: { subject: toStorage(subject), body: toStorage(body) },
            })
          }
        >
          {isSaving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>

      {previewResult && (
        <div className={styles.preview}>
          <p className={styles.previewSubject}>
            <span className={styles.previewLabel}>Asunto:</span> {previewResult.subject}
          </p>
          {/* `srcDoc` y NO `dangerouslySetInnerHTML`: el correo trae su propio
              <html> con estilos inline, e inyectarlo en la página rompería los
              estilos de la intranet. Un iframe con `srcDoc` no necesita tocar la
              CSP (`frame-src` no aplica a documentos sin origen) y además aísla
              el HTML del admin del resto de la pantalla. */}
          <iframe
            className={styles.previewFrame}
            title={`Previsualización de ${template.label}`}
            srcDoc={previewResult.html}
            sandbox=""
          />
          <p className={styles.hint}>
            Previsualización con datos de ejemplo. No se ha enviado ningún correo.
          </p>
        </div>
      )}
    </div>
  );
}
