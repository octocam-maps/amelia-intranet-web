import { apiClient } from '@/lib/http/api-client';
import type {
  AcknowledgeManualResult,
  CompleteProfileInput,
  CompleteProfileResult,
  OnboardingStep,
  QuizResult,
  ReportVideoProgressInput,
  SignDocumentResult,
  SubmitQuizInput,
  VideoProgressResult,
} from '../domain/models';
import type { OnboardingRepository } from '../domain/ports';
import type {
  AcknowledgeManualDTO,
  CompleteProfileResultDTO,
  OnboardingMeDTO,
  QuizResultDTO,
  SignDocumentDTO,
  VideoProgressDTO,
} from './dtos';
import {
  acknowledgeManualFromDTO,
  completeProfileResultFromDTO,
  quizResultFromDTO,
  signDocumentFromDTO,
  stepFromDTO,
  videoProgressFromDTO,
} from './mappers';

export const onboardingApiAdapter: OnboardingRepository = {
  async getMyOnboarding(): Promise<OnboardingStep[]> {
    const dto = await apiClient<OnboardingMeDTO>('/onboarding/me');
    return dto.steps.map(stepFromDTO);
  },

  async reportVideoProgress(
    stepId: string,
    input: ReportVideoProgressInput
  ): Promise<VideoProgressResult> {
    const dto = await apiClient<VideoProgressDTO>(`/onboarding/steps/${stepId}/video-progress`, {
      method: 'POST',
      body: JSON.stringify({ progress_pct: input.progressPct }),
    });
    return videoProgressFromDTO(dto);
  },

  async submitQuiz(stepId: string, input: SubmitQuizInput): Promise<QuizResult> {
    const dto = await apiClient<QuizResultDTO>(`/onboarding/steps/${stepId}/quiz`, {
      method: 'POST',
      body: JSON.stringify({ answers: input.answers }),
    });
    return quizResultFromDTO(dto);
  },

  async signDocument(stepId: string): Promise<SignDocumentResult> {
    const dto = await apiClient<SignDocumentDTO>(`/onboarding/steps/${stepId}/sign`, {
      method: 'POST',
    });
    return signDocumentFromDTO(dto);
  },

  async acknowledgeManual(stepId: string): Promise<AcknowledgeManualResult> {
    const dto = await apiClient<AcknowledgeManualDTO>(`/onboarding/steps/${stepId}/acknowledge`, {
      method: 'POST',
    });
    return acknowledgeManualFromDTO(dto);
  },

  async completeProfile(stepId: string, input: CompleteProfileInput): Promise<CompleteProfileResult> {
    const dto = await apiClient<CompleteProfileResultDTO>(
      `/onboarding/steps/${stepId}/complete-profile`,
      {
        method: 'POST',
        body: JSON.stringify({
          full_name: input.fullName,
          birth_date: input.birthDate,
          dni_nie: input.dniNie,
          personal_phone: input.personalPhone,
          company_phone: input.companyPhone || null,
          address: input.address,
          department_id: input.departmentId,
        }),
      }
    );
    return completeProfileResultFromDTO(dto);
  },
};
