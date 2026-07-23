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
} from './models';

export interface OnboardingRepository {
  getMyOnboarding(): Promise<OnboardingStep[]>;
  reportVideoProgress(stepId: string, input: ReportVideoProgressInput): Promise<VideoProgressResult>;
  submitQuiz(stepId: string, input: SubmitQuizInput): Promise<QuizResult>;
  uploadSignedDocument(stepId: string, file: File): Promise<UploadSignedDocumentResult>;
  acknowledgeManual(stepId: string): Promise<AcknowledgeManualResult>;
  completeProfile(stepId: string, input: CompleteProfileInput): Promise<CompleteProfileResult>;
}
