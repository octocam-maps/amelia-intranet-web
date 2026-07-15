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
