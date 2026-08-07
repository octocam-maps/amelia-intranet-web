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
  /** Baja DEFINITIVA: borrado lógico con anonimización. NO confundir con
   * `update(id, { isActive: false })`, que solo suspende el acceso y es
   * reversible sin pérdida de datos. */
  remove(id: string): Promise<void>;
  roleHistory(id: string): Promise<RoleChange[]>;
}
