import { FileText } from 'lucide-react';
import styles from './AdminDocumentsPlaceholderCard.module.css';

/** Pestaña "Documentos" del Home admin — Fase 4 (Documentos + Drive) todavía
 * no tiene endpoint; placeholder honesto en vez de una maqueta con datos
 * inventados. */
export function AdminDocumentsPlaceholderCard() {
  return (
    <div className={styles.root}>
      <FileText className={styles.icon} />
      <p className={styles.title}>Próximamente</p>
      <p className={styles.body}>
        La gestión de documentos y la integración con Google Drive llegan en la Fase 4.
      </p>
    </div>
  );
}
