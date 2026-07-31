import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { usePreviewEmailTemplate } from '../application/usePreviewEmailTemplate';
import { useRestoreEmailTemplate } from '../application/useRestoreEmailTemplate';
import { useUpdateEmailTemplate } from '../application/useUpdateEmailTemplate';
import type { EmailTemplate } from '../domain/models';
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
  const [subject, setSubject] = useState(template.subject);
  const [bodyHtml, setBodyHtml] = useState(template.bodyHtml);

  const { mutate: save, isPending: isSaving, error: saveError } = useUpdateEmailTemplate();
  const { mutate: restore, isPending: isRestoring } = useRestoreEmailTemplate();
  const { mutate: preview, data: previewResult, isPending: isPreviewing } =
    usePreviewEmailTemplate();

  const isDirty = subject !== template.subject || bodyHtml !== template.bodyHtml;
  const canSave = subject.trim().length > 0 && bodyHtml.trim().length > 0 && isDirty;

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
          className={styles.textarea}
          rows={7}
          value={bodyHtml}
          onChange={(event) => setBodyHtml(event.target.value)}
        />
        <p className={styles.hint}>
          Admite HTML sencillo (<code>&lt;p&gt;</code>, <code>&lt;strong&gt;</code>,{' '}
          <code>&lt;a&gt;</code>). El logo, el botón y el pie del correo los pone la intranet.
        </p>
      </div>

      <div className={styles.placeholders}>
        <p className={styles.hint}>Puedes usar estos campos, y se sustituyen al enviar:</p>
        <div className={styles.chips}>
          {/* La lista la manda el BACKEND: es la misma lista blanca que aplica al
              renderizar, así que la ayuda no puede quedarse desincronizada. */}
          {availablePlaceholders.map((placeholder) => (
            <code key={placeholder} className={styles.chip}>{`{{${placeholder}}}`}</code>
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
          onClick={() => preview({ templateKey: template.templateKey, draft: { subject, bodyHtml } })}
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
          onClick={() => save({ templateKey: template.templateKey, input: { subject, bodyHtml } })}
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
