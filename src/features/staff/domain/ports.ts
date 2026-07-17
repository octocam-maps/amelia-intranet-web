import type {
  CreateStaffMemberInput,
  StaffListParams,
  StaffListResult,
  StaffMember,
  UpdateStaffMemberInput,
} from './models';

export interface StaffRepository {
  list(params?: StaffListParams): Promise<StaffListResult>;
  create(input: CreateStaffMemberInput): Promise<StaffMember>;
  update(id: string, input: UpdateStaffMemberInput): Promise<StaffMember>;
}
