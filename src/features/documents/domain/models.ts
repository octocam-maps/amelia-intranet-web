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

/** Veredicto del provisioning para una persona.
 *
 * `mover` es el único que toca una carpeta que YA existe (la reubica bajo su
 * entidad conservando su id y su contenido). Los otros tres, o crean algo
 * nuevo, o no hacen nada. Por eso la UI los separa: un movimiento no tiene
 * deshacer y quien pulsa el botón tiene que verlo por nombre antes. */
export const FOLDER_PLAN_ACTIONS = ['crear', 'mover', 'ya_en_su_sitio', 'ya_registrada'] as const;
export type FolderPlanAction = (typeof FOLDER_PLAN_ACTIONS)[number];

export interface FolderPlanEntry {
  userId: string;
  email: string;
  entityName: string | null;
  action: FolderPlanAction;
  missingCategories: string[];
}

/** Pasada EN SECO de `GET /documents/provision-folders/plan`: lo que haría el
 * volcado, sin haberlo hecho. No escribe nada en Drive. */
export interface BulkFolderPlan {
  entries: FolderPlanEntry[];
  entityFoldersToCreate: string[];
  toCreate: number;
  toMove: number;
  alreadyOk: number;
  categoryFoldersToCreate: number;
  /** Escrituras que costaría aplicarlo. Drive limita por proyecto, y saberlo
   * antes evita descubrir el corte con el árbol a medias. */
  estimatedDriveWrites: number;
}

/** Resultado de `POST /documents/provision-folders`. */
export interface DriveFolderProvisionRun {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: DriveSyncRunStatus;
  created: number;
  skipped: number;
  failed: number;
  errorDetail: string | null;
}
