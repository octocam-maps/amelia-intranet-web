/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface StaffMemberDTO {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  department: string | null;
  entity_code: string;
  entity_name: string;
  role: string;
  status: string;
  avatar_url: string | null;
  hire_date: string | null;
  vacation_days_per_year: number | null;
  is_active: boolean;
}

export interface StaffListDTO {
  members: StaffMemberDTO[];
  total: number;
  page: number;
  page_size: number;
}

export interface StaffMemberInputDTO {
  full_name: string;
  email: string;
  job_title: string;
  department?: string | null;
  entity_code: string;
  role: string;
  hire_date?: string | null;
  vacation_days_per_year?: number | null;
  is_active: boolean;
}
