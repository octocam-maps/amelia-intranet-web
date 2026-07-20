import { useMemo, useState } from 'react';
import { DownloadIcon, ExclamationTriangleIcon, FileTextIcon } from '@radix-ui/react-icons';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useDocuments } from '../application/useDocuments';
import { useDownloadDocument } from '../application/useDownloadDocument';
import type { Document, DocumentCategory } from '../domain/models';
import styles from './DocumentsPage.module.css';

type CategoryFilter = DocumentCategory | 'all';

// `payslip` no aparece aquí: tiene su propia página ("Nóminas"); las
// carpetas más finas del deck (Onboarding, PRL, Certificados…) no existen
// como categoría real en `employee_documents` — todas caen en `general` u
// `other` según cómo las categorizó el sync o el admin al subirlas.
const CATEGORY_LABEL: Record<Exclude<DocumentCategory, 'payslip'>, string> = {
  contract: 'Contrato',
  general: 'General',
  other: 'Otros',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * deck-fase4 pág. 50 "Documentos" (carpetas + archivos) y pág. 52 (móvil,
 * pills de categoría con contador). Una sola llamada sin filtro de
 * categoría — el propio backend ya limita a los documentos del usuario
 * (RGPD); el filtro de categoría se resuelve en cliente, mismo patrón que
 * los pills de entidad de `StaffPage`. Sin visor PDF embebido — ver nota en
 * `PayslipsPage`.
 */
export function DocumentsPage() {
  const { data: allDocuments = [], isLoading, error } = useDocuments();
  const { mutate: download, isPending: isDownloading } = useDownloadDocument();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const documents = useMemo<Document[]>(
    () => allDocuments.filter((doc) => doc.category !== 'payslip'),
    [allDocuments]
  );

  const categories = useMemo(
    () =>
      (Object.keys(CATEGORY_LABEL) as Array<Exclude<DocumentCategory, 'payslip'>>)
        .map((category) => ({
          code: category,
          label: CATEGORY_LABEL[category],
          count: documents.filter((doc) => doc.category === category).length,
        }))
        .filter((category) => category.count > 0),
    [documents]
  );

  const visibleDocuments = useMemo(
    () => (categoryFilter === 'all' ? documents : documents.filter((doc) => doc.category === categoryFilter)),
    [documents, categoryFilter]
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Documentos</h1>
        <p className={styles.subtitle}>Tu carpeta personal</p>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <ExclamationTriangleIcon className={styles.errorBannerIcon} />
          No se pudieron cargar los documentos: {error instanceof Error ? error.message : 'error desconocido'}.
        </div>
      )}

      <Card className={styles.card}>
        {categories.length > 0 && (
          <div className={styles.filters}>
            <button
              type="button"
              className={cn(styles.filterPill, categoryFilter === 'all' && styles.filterPillActive)}
              onClick={() => setCategoryFilter('all')}
            >
              Todos · {documents.length}
            </button>
            {categories.map((category) => (
              <button
                key={category.code}
                type="button"
                className={cn(styles.filterPill, categoryFilter === category.code && styles.filterPillActive)}
                onClick={() => setCategoryFilter(category.code)}
              >
                {category.label} · {category.count}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <p className={styles.empty}>Cargando documentos…</p>
        ) : visibleDocuments.length === 0 ? (
          <p className={styles.empty}>Todavía no tienes documentos en esta carpeta.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {visibleDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <span className={styles.fileCell}>
                      <FileTextIcon className={styles.fileIcon} />
                      {doc.title}
                    </span>
                  </td>
                  <td>{CATEGORY_LABEL[doc.category as Exclude<DocumentCategory, 'payslip'>]}</td>
                  <td className={styles.date}>{formatDate(doc.uploadedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => download({ id: doc.id, title: doc.title })}
                      disabled={isDownloading}
                      aria-label={`Descargar ${doc.title}`}
                    >
                      <DownloadIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
