import type {
  AcknowledgeManualResult,
  CompleteProfileResult,
  OnboardingStep,
  OnboardingStepStatus,
  OnboardingStepType,
  QuizResult,
  UploadSignedDocumentResult,
  VideoProgressResult,
} from '../domain/models';
import type {
  AcknowledgeManualDTO,
  CompleteProfileResultDTO,
  OnboardingStepDTO,
  QuizResultDTO,
  UploadSignedDocumentDTO,
  VideoProgressDTO,
} from './dtos';

export function stepFromDTO(dto: OnboardingStepDTO): OnboardingStep {
  return {
    id: dto.id,
    stepOrder: dto.step_order,
    type: dto.type as OnboardingStepType,
    title: dto.title,
    config: dto.config,
    status: dto.status as OnboardingStepStatus,
    progressPct: dto.progress_pct,
    data: dto.data,
    startedAt: dto.started_at,
    completedAt: dto.completed_at,
    // Se lee `documents` (plural) y NO el `document` deprecado: con dos manuales,
    // el singular solo trae el primero y el paso 3 quedaría a medias. `?? []`
    // cubre una respuesta de backend anterior a la 040.
    documents: (dto.documents ?? []).map((document) => ({
      id: document.id,
      kind: document.kind,
      title: document.title,
      version: document.version,
      url: document.url,
      displayOrder: document.display_order,
      acknowledged: document.acknowledged,
      locked: document.locked,
    })),
  };
}

export function videoProgressFromDTO(dto: VideoProgressDTO): VideoProgressResult {
  return {
    id: dto.id,
    stepId: dto.step_id,
    status: dto.status as OnboardingStepStatus,
    progressPct: dto.progress_pct,
    startedAt: dto.started_at,
    completedAt: dto.completed_at,
  };
}

export function quizResultFromDTO(dto: QuizResultDTO): QuizResult {
  return {
    stepId: dto.step_id,
    score: dto.score,
    passed: dto.passed,
    submittedAt: dto.submitted_at,
    // `?? []` / `?? 0`: los tres campos son nuevos y el backend los declara
    // con default, así que una respuesta cacheada o de una versión anterior
    // llegaría sin ellos. Sin el fallback, `incorrectQuestionIds.map` de la UI
    // reventaría con un `undefined`.
    incorrectQuestionIds: dto.incorrect_question_ids ?? [],
    attemptsUsed: dto.attempts_used ?? 1,
    attemptsLeft: dto.attempts_left ?? 0,
  };
}

export function uploadSignedDocumentFromDTO(dto: UploadSignedDocumentDTO): UploadSignedDocumentResult {
  return {
    id: dto.id,
    stepId: dto.step_id,
    employeeDocumentId: dto.employee_document_id,
    uploadedAt: dto.uploaded_at,
  };
}

export function acknowledgeManualFromDTO(dto: AcknowledgeManualDTO): AcknowledgeManualResult {
  return {
    id: dto.id,
    stepId: dto.step_id,
    documentId: dto.document_id,
    acknowledgedAt: dto.acknowledged_at,
  };
}

export function completeProfileResultFromDTO(dto: CompleteProfileResultDTO): CompleteProfileResult {
  return {
    id: dto.id,
    stepId: dto.step_id,
    status: dto.status as OnboardingStepStatus,
    progressPct: dto.progress_pct,
    startedAt: dto.started_at,
    completedAt: dto.completed_at,
  };
}
