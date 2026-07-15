/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface TeamMemberDTO {
  id: string;
  full_name: string;
  job_title: string | null;
  entity_code: string | null;
  entity_name: string | null;
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

export interface TeamBirthdayDTO {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  day: number;
  month: number;
  is_today: boolean;
}

export interface TeamBirthdayListDTO {
  birthdays: TeamBirthdayDTO[];
}
