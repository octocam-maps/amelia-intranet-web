/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface OnboardingStepDTO {
  id: string;
  step_order: number;
  type: string;
  title: string;
  config: unknown;
  status: string;
  progress_pct: number;
  data: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface OnboardingMeDTO {
  steps: OnboardingStepDTO[];
}

export interface VideoProgressDTO {
  id: string;
  step_id: string;
  status: string;
  progress_pct: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface QuizResultDTO {
  step_id: string;
  score: number;
  passed: boolean;
  submitted_at: string;
}

export interface UploadSignedDocumentDTO {
  id: string;
  step_id: string;
  employee_document_id: string;
  uploaded_at: string;
}

export interface AcknowledgeManualDTO {
  id: string;
  step_id: string;
  document_id: string;
  acknowledged_at: string;
}

/** Respuesta de `POST /steps/{id}/complete-profile` — `OnboardingProgressDTO`
 * en el backend (progreso del propio paso, no el step con `config`/`title`). */
export interface CompleteProfileResultDTO {
  id: string;
  step_id: string;
  status: string;
  progress_pct: number;
  started_at: string | null;
  completed_at: string | null;
}
