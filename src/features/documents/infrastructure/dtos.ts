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
