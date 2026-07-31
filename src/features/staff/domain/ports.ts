import type {
  CreateStaffMemberInput,
  StaffListParams,
  StaffListResult,
  RoleChange,
  StaffMember,
  UpdateStaffMemberInput,
} from './models';

export interface StaffRepository {
  list(params?: StaffListParams): Promise<StaffListResult>;
  create(input: CreateStaffMemberInput): Promise<StaffMember>;
  update(id: string, input: UpdateStaffMemberInput): Promise<StaffMember>;
  roleHistory(id: string): Promise<RoleChange[]>;
}
