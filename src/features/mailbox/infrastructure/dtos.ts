/** Formas snake_case tal cual las devuelve el backend (Pydantic). */

export interface MailboxMessageDTO {
  id: string;
  reference_code: string;
  category: string;
  body: string;
  status: string;
  created_at: string;
  reply: string | null;
  resolved_at: string | null;
}

export interface MailboxMessageListDTO {
  messages: MailboxMessageDTO[];
}

export interface CreateMailboxMessageResultDTO {
  reference_code: string;
}

/** `GET /mailbox/track/{reference_code}` — forma propia (`TrackMessageDTO`
 * en el backend), distinta de `MailboxMessageDTO`: sin `id`, con `subject`
 * y `admin_reply` en vez de `reply`. */
export interface TrackMessageDTO {
  reference_code: string;
  category: string;
  subject: string | null;
  body: string;
  status: string;
  admin_reply: string | null;
  created_at: string;
}
