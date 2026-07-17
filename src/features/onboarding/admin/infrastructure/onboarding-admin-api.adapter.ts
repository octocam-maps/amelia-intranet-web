import { apiClient } from '@/lib/http/api-client';
import type {
  AdminOnboardingStep,
  OnboardingProgressEmployee,
  ResetQuizAttemptInput,
  UpdateOnboardingStepInput,
} from '../domain/models';
import type { OnboardingAdminRepository } from '../domain/ports';
import type { AdminOnboardingStepDTO, AdminOnboardingStepsDTO, OnboardingProgressDTO } from './dtos';
import { adminStepFromDTO, progressEmployeeFromDTO, updateStepInputToDTO } from './mappers';

export const onboardingAdminApiAdapter: OnboardingAdminRepository = {
  async listSteps(): Promise<AdminOnboardingStep[]> {
    const dto = await apiClient<AdminOnboardingStepsDTO>('/onboarding/admin/steps');
    return dto.steps.map(adminStepFromDTO);
  },

  async updateStep(stepId: string, input: UpdateOnboardingStepInput): Promise<AdminOnboardingStep> {
    const dto = await apiClient<AdminOnboardingStepDTO>(`/onboarding/admin/steps/${stepId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateStepInputToDTO(input)),
    });
    return adminStepFromDTO(dto);
  },

  async listProgress(): Promise<OnboardingProgressEmployee[]> {
    const dto = await apiClient<OnboardingProgressDTO>('/onboarding/admin/progress');
    return dto.employees.map(progressEmployeeFromDTO);
  },

  async resetQuizAttempt(stepId: string, input: ResetQuizAttemptInput): Promise<void> {
    await apiClient<void>(`/onboarding/admin/steps/${stepId}/reset-quiz`, {
      method: 'POST',
      body: JSON.stringify({ user_id: input.userId }),
    });
  },
};
