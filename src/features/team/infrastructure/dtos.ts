/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface TeamMemberDTO {
  id: string;
  full_name: string;
  job_title: string;
  entity_code: string;
  entity_name: string;
  phone: string | null;
  email: string;
  avatar_url: string | null;
}

export interface TeamMemberListDTO {
  members: TeamMemberDTO[];
}

export interface TeamVacationEntryDTO {
  user_id: string;
  full_name: string;
  start_date: string;
  end_date: string;
}

export interface TeamVacationEntryListDTO {
  entries: TeamVacationEntryDTO[];
}
