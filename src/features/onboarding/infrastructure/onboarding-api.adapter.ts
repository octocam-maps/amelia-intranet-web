import { API_BASE_URL, apiClient, ApiError } from '@/lib/http/api-client';
import { useStore } from '@/store';
import type {
  AcknowledgeManualResult,
  CompleteProfileInput,
  CompleteProfileResult,
  OnboardingStep,
  QuizResult,
  ReportVideoProgressInput,
  SubmitQuizInput,
  UploadSignedDocumentResult,
  VideoProgressResult,
} from '../domain/models';
import type { OnboardingRepository } from '../domain/ports';
import type {
  AcknowledgeManualDTO,
  CompleteProfileResultDTO,
  OnboardingMeDTO,
  QuizResultDTO,
  UploadSignedDocumentDTO,
  VideoProgressDTO,
} from './dtos';
import {
  acknowledgeManualFromDTO,
  completeProfileResultFromDTO,
  quizResultFromDTO,
  stepFromDTO,
  uploadSignedDocumentFromDTO,
  videoProgressFromDTO,
} from './mappers';

function authHeaders(): Record<string, string> {
  const accessToken = useStore.getState().getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

/** Extrae el mensaje de error del backend (`{"detail": {"message": ...}}` o
 * `{"detail": "..."}`) — mismo formato que `apiClient`, duplicado aquí
 * porque `uploadSignedDocument` no pasa por `apiClient` (body no-JSON). Ver
 * `documentsApiAdapter.upload`, mismo patrón exacto. */
async function parseErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload: unknown = await response.json().catch(() => null);
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (detail && typeof detail === 'object' && 'message' in detail) {
      const message = (detail as { message: unknown }).message;
      if (typeof message === 'string') return message;
    }
  }
  return fallback;
}

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

  async uploadSignedDocument(stepId: string, file: File): Promise<UploadSignedDocumentResult> {
    // No usa `apiClient`: el body es `FormData` (multipart), no JSON — mismo
    // motivo que `documentsApiAdapter.upload`. Único campo `file`: el
    // `user_id` lo deriva el backend del JWT, nunca viaja en el payload.
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/onboarding/steps/${stepId}/documents`, {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(),
      body: formData,
    });
    if (!response.ok) {
      const message = await parseErrorMessage(response, 'No se pudo subir el documento.');
      throw new ApiError(message, response.status);
    }
    const dto = (await response.json()) as UploadSignedDocumentDTO;
    return uploadSignedDocumentFromDTO(dto);
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
