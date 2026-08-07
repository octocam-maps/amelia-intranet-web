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

/** Veredicto del volcado para una persona.
 *
 * `mover` y `recolocar` son los dos que tocan una carpeta que YA existe, y por
 * eso la UI los enumera por nombre: son las únicas operaciones sin deshacer.
 * `mover` es herencia del árbol plano y desaparece tras el primer volcado;
 * `recolocar` es recurrente — pasa cada vez que alguien cambia de sociedad. */
export const FOLDER_PLAN_ACTIONS = ['crear', 'mover', 'recolocar'] as const;
export type FolderPlanAction = (typeof FOLDER_PLAN_ACTIONS)[number];

export interface FolderPlanEntry {
  userId: string;
  email: string;
  entityName: string | null;
  action: FolderPlanAction;
}

/** Pasada EN SECO de `GET /documents/provision-folders/plan`.
 *
 * Solo habla del trabajo PENDIENTE: a quien ya tiene su carpeta en su sitio ni
 * se le menciona. Por eso `alreadyDone` viene aparte — es el denominador que
 * permite pintar «12 de 37» en vez de solo «quedan 25». */
export interface BulkFolderPlan {
  entries: FolderPlanEntry[];
  entityFoldersToCreate: string[];
  pending: number;
  alreadyDone: number;
  toCreate: number;
  toMove: number;
  categoryFoldersToCreate: number;
  estimatedDriveWrites: number;
}

/** Resultado de UN lote de `POST /documents/provision-folders`.
 *
 * `remaining` gobierna el bucle del cliente y lo calcula el servidor
 * consultando la base — no es `total - procesadas`. Quien falla sigue contando
 * como pendiente, y esa diferencia es la señal de que hay que parar. */
export interface FolderBatchResult {
  processed: number;
  created: number;
  relocated: number;
  failed: number;
  remaining: number;
}
