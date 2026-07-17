import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { AdminDocumentUploadForm } from './AdminDocumentUploadForm';
import styles from './AdminDocumentUploadDialog.module.css';

interface AdminDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** deck-fase4 · admin "Subir documento" — alta manual de un documento para
 * un empleado concreto; el binario viaja a su carpeta de Drive y solo el
 * metadato queda indexado en Postgres (`POST /documents`). */
export function AdminDocumentUploadDialog({ open, onOpenChange }: AdminDocumentUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
          <p className={styles.description}>El archivo se sube a la carpeta de Drive del empleado.</p>
        </DialogHeader>
        <AdminDocumentUploadForm onSaved={() => onOpenChange(false)} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
