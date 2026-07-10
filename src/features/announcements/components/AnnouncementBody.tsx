import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import styles from './AnnouncementBody.module.css';

interface AnnouncementBodyProps {
  body: string;
  className?: string;
}

/**
 * Elementos permitidos en el cuerpo de un anuncio: negrita, cursiva, enlaces,
 * listas y saltos de párrafo. NADA de HTML crudo.
 */
const ALLOWED_ELEMENTS = ['p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'br'];

function MarkdownLink({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link} {...props}>
      {children}
    </a>
  );
}

/**
 * Renderiza el cuerpo (Markdown ligero) de un anuncio del admin, que se
 * muestra a toda la plantilla. Por eso se acota a `ALLOWED_ELEMENTS` y se usa
 * react-markdown SIN rehype-raw ni dangerouslySetInnerHTML: el HTML crudo
 * queda escapado como texto y react-markdown ya neutraliza esquemas
 * `javascript:` en los enlaces (`urlTransform` por defecto).
 */
export function AnnouncementBody({ body, className }: AnnouncementBodyProps) {
  return (
    <div className={cn(styles.markdown, className)}>
      <ReactMarkdown allowedElements={ALLOWED_ELEMENTS} components={{ a: MarkdownLink }}>
        {body}
      </ReactMarkdown>
    </div>
  );
}
