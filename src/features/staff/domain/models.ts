import type { UserRole } from '@/features/auth/domain/models';

export type EntityCode = 'hub' | 'lab' | 'ops';

export type StaffStatus = 'activa' | 'vacaciones' | 'baja';

export interface StaffMember {
  id: string;
  fullName: string;
  email: string;
  jobTitle: string;
  department: string | null;
  entityCode: EntityCode;
  entityName: string;
  role: UserRole;
  status: StaffStatus;
  avatarUrl: string | null;
  hireDate: string | null;
  vacationDaysPerYear: number | null;
  isActive: boolean;
}

export interface StaffMemberInput {
  fullName: string;
  email: string;
  jobTitle: string;
  department?: string | null;
  entityCode: EntityCode;
  role: UserRole;
  hireDate?: string | null;
  vacationDaysPerYear?: number | null;
  isActive: boolean;
}

export interface StaffListParams {
  entityCode?: EntityCode;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface StaffListResult {
  members: StaffMember[];
  total: number;
  page: number;
  pageSize: number;
}
