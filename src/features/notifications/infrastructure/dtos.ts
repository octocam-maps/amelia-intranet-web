/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: { url?: string } | null;
  read: boolean;
  created_at: string;
}

export interface NotificationListDTO {
  items: NotificationDTO[];
  next_before: string | null;
}

export interface UnreadCountDTO {
  count: number;
}

export interface MarkAllReadDTO {
  updated: number;
}
