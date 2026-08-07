/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface DocumentDTO {
  id: string;
  user_id: string;
  category: string;
  title: string;
  period: string | null;
  mime_type: string;
  uploaded_by: string | null;
  uploaded_at: string;
  created_at: string;
}

export interface DocumentListDTO {
  documents: DocumentDTO[];
}

export interface DriveSyncRunDTO {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  files_synced: number;
  error_detail: string | null;
}

export interface FolderPlanEntryDTO {
  user_id: string;
  email: string;
  entity_name: string | null;
  action: string;
}

export interface BulkFolderPlanDTO {
  entries: FolderPlanEntryDTO[];
  entity_folders_to_create: string[];
  pending: number;
  already_done: number;
  to_create: number;
  to_move: number;
  category_folders_to_create: number;
  estimated_drive_writes: number;
}

export interface FolderBatchResultDTO {
  processed: number;
  created: number;
  relocated: number;
  failed: number;
  remaining: number;
}
