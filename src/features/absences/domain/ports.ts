import type {
  AbsenceBalance,
  AbsenceRequest,
  AbsenceType,
  CreateAbsenceRequestInput,
  ListAbsenceRequestsMode,
  ReviewAbsenceRequestInput,
} from './models';

export interface AbsencesRepository {
  listTypes(): Promise<AbsenceType[]>;
  getBalance(params?: { userId?: string; year?: number }): Promise<AbsenceBalance[]>;
  createRequest(input: CreateAbsenceRequestInput): Promise<AbsenceRequest>;
  listRequests(params?: {
    mode?: ListAbsenceRequestsMode;
    userId?: string;
  }): Promise<AbsenceRequest[]>;
  reviewRequest(requestId: string, input: ReviewAbsenceRequestInput): Promise<AbsenceRequest>;
}
