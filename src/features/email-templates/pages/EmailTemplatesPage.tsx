import { ConfigTabsNav } from '@/components/composites/ConfigTabsNav';
import { Card } from '@/components/ui/Card';
import { useEmailTemplates } from '../application/useEmailTemplates';
import { EmailTemplateEditor } from '../components/EmailTemplateEditor';
import styles from './EmailTemplatesPage.module.css';

/**
 * Configuración · Plantillas de correo (migración backend 041).
 *
 * Comparte la cabecera de pestañas con Festivos, Tipos de ausencia y Onboarding:
 * es configuración de la intranet del mismo tipo, y el admin espera encontrarla
 * donde ya está el resto.
 *
 * No hay "crear plantilla": el catálogo es CERRADO — son los tipos de correo que
 * el backend sabe enviar, y una fila nueva no haría aparecer un correo nuevo.
 */
export function EmailTemplatesPage() {
  const { data, isLoading, isError } = useEmailTemplates();

  return (
    <div className={styles.root}>
      <div>
        <h2 className={styles.title}>Configuración · Plantillas de correo</h2>
        <p className={styles.subtitle}>
          Textos de los correos automáticos que manda la intranet
        </p>
      </div>

      <ConfigTabsNav active="plantillas-email" />

      {isError && (
        <Card className={styles.card}>
          <p className={styles.loadError}>
            No se han podido cargar las plantillas de correo. Inténtalo de nuevo en unos minutos.
          </p>
        </Card>
      )}

      {isLoading && (
        <Card className={styles.card}>
          <p className={styles.empty}>Cargando las plantillas de correo…</p>
        </Card>
      )}

      {data && (
        <Card className={styles.card}>
          <div className={styles.list}>
            {data.templates.map((template) => (
              <EmailTemplateEditor
                // `key` compuesta a propósito: al guardar cambia `updatedAt` y al
                // restaurar cambia `isActive`, así que React remonta el editor y
                // su borrador se reinicia con lo que el servidor tiene ahora. Es
                // lo que evita un `useEffect` de sincronización que tendría que
                // mentirle a `exhaustive-deps` para no pisar lo que el admin
                // está escribiendo.
                key={`${template.templateKey}:${template.updatedAt ?? ''}:${template.isActive}`}
                template={template}
                availablePlaceholders={data.availablePlaceholders}
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
