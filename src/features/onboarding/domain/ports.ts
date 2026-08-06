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
  /** `documentId` desde la migración backend 046: el paso 5 tiene cuatro
   * documentos y hay que decir a cuál corresponde el archivo firmado. Opcional
   * porque con un único documento activo el backend lo resuelve solo. */
  uploadSignedDocument(
    stepId: string,
    file: File,
    documentId?: string,
  ): Promise<UploadSignedDocumentResult>;
  /** El PDF del paso 5 ya rellenado con los datos del perfil de quien lo pide.
   * Devuelve el binario porque el endpoint exige `Authorization` (lleva datos
   * personales dentro) y un enlace directo no lo manda. */
  downloadSignableDocument(documentId: string): Promise<Blob>;
  acknowledgeManual(stepId: string, documentId: string): Promise<AcknowledgeManualResult>;
  completeProfile(stepId: string, input: CompleteProfileInput): Promise<CompleteProfileResult>;
}
