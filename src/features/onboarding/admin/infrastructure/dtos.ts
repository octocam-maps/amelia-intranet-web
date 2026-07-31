import type { OnboardingStepDocumentDTO } from '../../infrastructure/dtos';

/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface AdminOnboardingStepDTO {
  id: string;
  step_order: number;
  type: string;
  title: string;
  config: unknown;
  documents: OnboardingStepDocumentDTO[];
  is_active: boolean;
}

export interface AdminOnboardingStepsDTO {
  steps: AdminOnboardingStepDTO[];
}

export interface UpdateOnboardingStepDTO {
  title?: string;
  is_active?: boolean;
  config?: unknown;
}

export interface OnboardingProgressEmployeeDTO {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  status: string;
  completed_steps: number;
  total_steps: number;
  steps: EmployeeStepProgressDTO[];
  current_step_title: string | null;
}

export interface OnboardingProgressDTO {
  employees: OnboardingProgressEmployeeDTO[];
}

export interface ResetQuizAttemptDTO {
  user_id: string;
}

/** Un paso concreto de una persona (desglose de la bandeja de administración). */
export interface EmployeeStepProgressDTO {
  step_order: number;
  title: string;
  status: string;
}
