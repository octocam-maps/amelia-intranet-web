export type OnboardingStepType = 'video' | 'quiz' | 'signature' | 'manual' | 'profile';

export type OnboardingStepStatus = 'locked' | 'available' | 'in_progress' | 'completed';

/** `config.video` — el backend expone `url` + `duration` (segundos); el
 * asset real del paso 1 (`hincator.mp4`) todavía se sirve embebido en el
 * bundle del frontend (ver VideoStep), no desde esta URL. */
export interface VideoStepConfig {
  url: string;
  duration: number;
}

/** `config.quiz` — el backend enmascara `correct` en cada opción: nunca
 * llega al cliente. La forma exacta de `options` (string plano vs. objeto
 * con id) no está fijada en el contrato — se asume `string[]` y el valor de
 * respuesta enviado es el propio texto de la opción seleccionada. */
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
}

export interface QuizStepConfig {
  questions: QuizQuestion[];
  threshold: number;
}

/**
 * Un paso del onboarding — el backend en `GET /onboarding/me` ya filtra la
 * lista según el rol (p.ej. `externo_invitado` solo recibe `video` +
 * `manual`), así que aquí no hay ninguna rama de rol: se renderiza lo que
 * llega. `config` varía por `type` — cada Step component hace el cast
 * correspondiente. `data` guarda el resultado de un intento previo (p.ej.
 * `{score, passed}` de un quiz ya enviado) cuando el paso ya no está
 * disponible para reintentar.
 */
export interface OnboardingStep {
  id: string;
  stepOrder: number;
  type: OnboardingStepType;
  title: string;
  config: unknown;
  status: OnboardingStepStatus;
  progressPct: number;
  data: Record<string, unknown> | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ReportVideoProgressInput {
  progressPct: number;
}

export interface VideoProgressResult {
  id: string;
  stepId: string;
  status: OnboardingStepStatus;
  progressPct: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface SubmitQuizInput {
  answers: Record<string, string>;
}

export interface QuizResult {
  stepId: string;
  score: number;
  passed: boolean;
  submittedAt: string;
}

/** Respuesta de `POST /steps/{id}/documents` — ya no incluye hash/IP (esa
 * prueba de firma quedó fuera de la plataforma); `employeeDocumentId`
 * apunta al documento ya indexado en `employee_documents` (categoría
 * `signed`), visible luego en Documentos. */
export interface UploadSignedDocumentResult {
  id: string;
  stepId: string;
  employeeDocumentId: string;
  uploadedAt: string;
}

export interface AcknowledgeManualResult {
  id: string;
  stepId: string;
  documentId: string;
  acknowledgedAt: string;
}

/**
 * Los 7 campos del paso 5 ("Completar perfil", RF §3.5) — ver
 * `CompleteProfileRequestDTO` en
 * `amelia-intranet-back/src/features/onboarding/infrastructure/schemas.py`.
 * Los 6 primeros son obligatorios; `companyPhone` es el único opcional
 * ("móvil de empresa, si aplica").
 */
export interface CompleteProfileInput {
  fullName: string;
  /** `YYYY-MM-DD` (valor nativo de `<input type="date">`). */
  birthDate: string;
  dniNie: string;
  personalPhone: string;
  companyPhone?: string;
  address: string;
  departmentId: string;
}

/**
 * `POST /steps/{id}/complete-profile` responde `OnboardingProgressDTO`
 * (progreso del PROPIO paso 5, no el step completo con `config`/`title`) —
 * misma forma que `VideoProgressResult`.
 */
export interface CompleteProfileResult {
  id: string;
  stepId: string;
  status: OnboardingStepStatus;
  progressPct: number;
  startedAt: string | null;
  completedAt: string | null;
}
