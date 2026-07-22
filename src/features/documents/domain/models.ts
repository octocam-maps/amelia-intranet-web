/** Espejo de `employee_documents` (back, `database/migrations/004_documents.sql`) —
 * NO hay campo `size_bytes` en el esquema real; el binario vive en Drive, Postgres
 * solo indexa metadatos. */
export type DocumentCategory = 'payslip' | 'contract' | 'general' | 'signed' | 'other';

export interface Document {
  id: string;
  userId: string;
  category: DocumentCategory;
  title: string;
  /** 'YYYY-MM' — solo relevante para `category === 'payslip'`; el resto siempre `null`. */
  period: string | null;
  mimeType: string;
  /** `null` cuando lo insertó el sync automático desde Drive (`uploaded_by IS NULL`
   * en la tabla), nunca un usuario "sync" inventado. */
  uploadedBy: string | null;
  uploadedAt: string;
  createdAt: string;
}

export interface ListDocumentsParams {
  category?: DocumentCategory;
  /** Solo resuelto por el backend si el rol del que pide es `administrador` —
   * el resto siempre recibe únicamente lo suyo, sin importar qué mande aquí. */
  userId?: string;
}

export interface UploadDocumentInput {
  file: File;
  /** Empleado propietario del documento — lo elige el admin en el formulario. */
  userId: string;
  category: DocumentCategory;
  title: string;
  period?: string;
}

export type DriveSyncRunStatus = 'running' | 'success' | 'partial' | 'failed';

/** Resumen de una corrida de `POST /documents/sync` (tabla `drive_sync_runs`). */
export interface DriveSyncRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: DriveSyncRunStatus;
  filesSynced: number;
  errorDetail: string | null;
}
