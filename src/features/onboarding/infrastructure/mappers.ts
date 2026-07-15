import type {
  AcknowledgeManualResult,
  OnboardingStep,
  OnboardingStepStatus,
  OnboardingStepType,
  QuizResult,
  SignDocumentResult,
  VideoProgressResult,
} from '../domain/models';
import type {
  AcknowledgeManualDTO,
  OnboardingStepDTO,
  QuizResultDTO,
  SignDocumentDTO,
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
  };
}

export function signDocumentFromDTO(dto: SignDocumentDTO): SignDocumentResult {
  return {
    id: dto.id,
    stepId: dto.step_id,
    documentId: dto.document_id,
    documentVersion: dto.document_version,
    signedAt: dto.signed_at,
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
