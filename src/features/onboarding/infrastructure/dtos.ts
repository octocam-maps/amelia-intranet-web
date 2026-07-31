/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

/** Documento vigente del paso (manual a leer, plantilla a firmar). `url` es
 * `onboarding_documents.storage_ref` — el backend NO expone `content_hash`,
 * que es su registro de integridad interno. */
export interface OnboardingStepDocumentDTO {
  id: string;
  kind: string;
  title: string;
  version: number;
  url: string | null;
  /** Orden de lectura dentro del paso (migración backend 040). */
  display_order: number;
  acknowledged: boolean;
  /** `true` = queda un manual anterior sin confirmar. Lo calcula el BACKEND con
   * la misma regla que valida el POST, así que el candado que se pinta y el 422
   * que devolvería no pueden discrepar — NO recalcular aquí. */
  locked: boolean;
}

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
  /** Documentos del paso en orden de lectura. LISTA desde la migración backend
   * 040: el paso `manual` admite varios en cascada. */
  documents: OnboardingStepDocumentDTO[];
  /** DEPRECADO — primer elemento de `documents`. El backend lo mantiene por
   * compatibilidad con clientes anteriores a la 040; aquí ya no se lee. */
  document: OnboardingStepDocumentDTO | null;
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
  /** IDs de las preguntas falladas — nunca la respuesta correcta. */
  incorrect_question_ids: string[];
  attempts_used: number;
  attempts_left: number;
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
