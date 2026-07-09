/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface AnnouncementDTO {
  id: string;
  title: string;
  body: string;
  status: string;
  pinned: boolean;
  audience: string;
  published_at: string | null;
  created_at: string;
  view_count: number;
}

export interface AnnouncementListDTO {
  announcements: AnnouncementDTO[];
}

export interface AnnouncementInputDTO {
  title: string;
  body: string;
  audience: string;
  pinned: boolean;
  status: string;
}
