import { useMemo, useState } from 'react';
import {
  DownloadIcon,
  ExclamationTriangleIcon,
  FileTextIcon,
  ReloadIcon,
  TrashIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useStaffList } from '@/features/staff/application/useStaffList';
import { cn } from '@/lib/utils';
import { AdminDocumentUploadDialog } from '../components/AdminDocumentUploadDialog';
import { useDeleteDocument } from '../application/useDeleteDocument';
import { useDocuments } from '../application/useDocuments';
import { useDownloadDocument } from '../application/useDownloadDocument';
import { useSyncDocuments } from '../application/useSyncDocuments';
import type { Document, DocumentCategory, DriveSyncRunStatus } from '../domain/models';
import styles from './AdminDocumentsPage.module.css';

type CategoryFilter = DocumentCategory | 'all';

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  payslip: 'Nómina',
  contract: 'Contrato',
  general: 'General',
  signed: 'Firmados',
  other: 'Otros',
};
const CATEGORIES = Object.keys(CATEGORY_LABEL) as DocumentCategory[];

const SYNC_STATUS_LABEL: Record<DriveSyncRunStatus, string> = {
  running: 'en curso',
  success: 'completada',
  partial: 'parcial',
  failed: 'fallida',
};

// Techo "generoso" de plantilla para el selector de empleado — mismo
// criterio que `StaffPage` (el backend todavía no pagina de verdad
// `GET /staff`).
const STAFF_PICKER_CAP = 200;

const EMPTY_DOCUMENTS: Document[] = [];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * deck-fase4 · admin "Documentos" — sube documentos por empleado, dispara la
 * conciliación con Drive ("Sincronizar ahora") y gestiona (borra) lo que ya
 * existe. Ruta `/administracion/documentos`, solo visible en el navbar del
 * admin — pero, como siempre, "ocultar ≠ proteger": el backend rechaza a
 * cualquier otro rol en los 3 endpoints que usa esta página
 * (`require_role("administrador")`).
 */
export function AdminDocumentsPage() {
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: staff } = useStaffList({ pageSize: STAFF_PICKER_CAP });
  const members = useMemo(
    () => [...(staff?.members ?? [])].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')),
    [staff]
  );
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  const {
    data: documents = EMPTY_DOCUMENTS,
    isLoading,
    error,
  } = useDocuments(employeeFilter === 'all' ? {} : { userId: employeeFilter });
  const { mutate: removeDocument } = useDeleteDocument();
  const { mutate: download, isPending: isDownloading } = useDownloadDocument();
  const { mutate: sync, isPending: isSyncing, data: syncRun, error: syncError } = useSyncDocuments();

  const visibleDocuments = useMemo(
    () => (categoryFilter === 'all' ? documents : documents.filter((doc) => doc.category === categoryFilter)),
    [documents, categoryFilter]
  );

  const handleDelete = (doc: Document) => {
    if (window.confirm(`¿Eliminar "${doc.title}"? El archivo seguirá disponible en Drive.`)) {
      removeDocument(doc.id);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Documentos</h1>
          <p className={styles.subtitle}>Nóminas, contratos y documentos sincronizados con Google Drive</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={() => sync()} disabled={isSyncing}>
            <ReloadIcon className={cn(isSyncing && styles.spinning)} />
            {isSyncing ? 'Sincronizando…' : 'Sincronizar ahora'}
          </Button>
          <Button variant="dark" onClick={() => setIsUploadOpen(true)}>
            <UploadIcon />
            Subir documento
          </Button>
        </div>
      </div>

      {/* Resumen de la última corrida de `POST /documents/sync` — la
          request es síncrona (devuelve el run ya terminado), así que en
          cuanto llega la respuesta el estado nunca es "running". */}
      {syncRun && (
        <p className={cn(styles.syncNote, syncRun.status === 'failed' && styles.syncNoteError)}>
          Sincronización {SYNC_STATUS_LABEL[syncRun.status]}: {syncRun.filesSynced} archivo(s) conciliado(s)
          {syncRun.errorDetail ? ` — ${syncRun.errorDetail}` : ''}.
        </p>
      )}
      {syncError && (
        <p className={styles.syncNoteError}>
          {syncError instanceof Error ? syncError.message : 'No se pudo sincronizar con Drive.'}
        </p>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <ExclamationTriangleIcon className={styles.errorBannerIcon} />
          No se pudieron cargar los documentos: {error instanceof Error ? error.message : 'error desconocido'}.
        </div>
      )}

      <Card className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <button
              type="button"
              className={cn(styles.filterPill, categoryFilter === 'all' && styles.filterPillActive)}
              onClick={() => setCategoryFilter('all')}
            >
              Todas las categorías
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={cn(styles.filterPill, categoryFilter === category && styles.filterPillActive)}
                onClick={() => setCategoryFilter(category)}
              >
                {CATEGORY_LABEL[category]}
              </button>
            ))}
          </div>

          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger aria-label="Filtrar por empleado" className={styles.employeeFilter}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los empleados</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className={styles.empty}>Cargando documentos…</p>
        ) : visibleDocuments.length === 0 ? (
          <p className={styles.empty}>No hay documentos que coincidan con el filtro.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Archivo</th>
                <th>Categoría</th>
                <th>Período</th>
                <th>Origen</th>
                <th>Fecha</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {visibleDocuments.map((doc) => {
                const member = memberById.get(doc.userId);
                return (
                  <tr key={doc.id}>
                    <td>{member?.fullName ?? doc.userId}</td>
                    <td>
                      <span className={styles.fileCell}>
                        <FileTextIcon className={styles.fileIcon} />
                        {doc.title}
                      </span>
                    </td>
                    <td>{CATEGORY_LABEL[doc.category]}</td>
                    <td className={styles.muted}>{doc.period ?? '—'}</td>
                    {/* `uploadedBy === null` es el propio contrato del dominio
                        para "lo insertó el sync automático" (ver
                        `domain/models.ts`), nunca un usuario inventado. */}
                    <td className={styles.muted}>{doc.uploadedBy === null ? 'Drive (sync)' : 'Manual'}</td>
                    <td className={styles.muted}>{formatDateTime(doc.uploadedAt)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => download({ id: doc.id, title: doc.title })}
                          disabled={isDownloading}
                          aria-label={`Descargar ${doc.title}`}
                        >
                          <DownloadIcon />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => handleDelete(doc)}
                          aria-label={`Eliminar ${doc.title}`}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <AdminDocumentUploadDialog open={isUploadOpen} onOpenChange={setIsUploadOpen} />
    </div>
  );
}
