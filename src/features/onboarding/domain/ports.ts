import type {
  AcknowledgeManualResult,
  CompleteProfileInput,
  OnboardingStep,
  QuizResult,
  ReportVideoProgressInput,
  SignDocumentResult,
  SubmitQuizInput,
  VideoProgressResult,
} from './models';

export interface OnboardingRepository {
  getMyOnboarding(): Promise<OnboardingStep[]>;
  reportVideoProgress(stepId: string, input: ReportVideoProgressInput): Promise<VideoProgressResult>;
  submitQuiz(stepId: string, input: SubmitQuizInput): Promise<QuizResult>;
  signDocument(stepId: string): Promise<SignDocumentResult>;
  acknowledgeManual(stepId: string): Promise<AcknowledgeManualResult>;
  completeProfile(stepId: string, input: CompleteProfileInput): Promise<OnboardingStep>;
}
