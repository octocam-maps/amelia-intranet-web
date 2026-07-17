import type {
  AdminOnboardingStep,
  OnboardingProgressEmployee,
  ResetQuizAttemptInput,
  UpdateOnboardingStepInput,
} from './models';

export interface OnboardingAdminRepository {
  listSteps(): Promise<AdminOnboardingStep[]>;
  updateStep(stepId: string, input: UpdateOnboardingStepInput): Promise<AdminOnboardingStep>;
  listProgress(): Promise<OnboardingProgressEmployee[]>;
  resetQuizAttempt(stepId: string, input: ResetQuizAttemptInput): Promise<void>;
}
