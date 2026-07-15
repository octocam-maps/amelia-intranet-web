import type { StaffListParams, StaffListResult, StaffMember, StaffMemberInput } from './models';

export interface StaffRepository {
  list(params?: StaffListParams): Promise<StaffListResult>;
  create(input: StaffMemberInput): Promise<StaffMember>;
  update(id: string, input: Partial<StaffMemberInput>): Promise<StaffMember>;
}
