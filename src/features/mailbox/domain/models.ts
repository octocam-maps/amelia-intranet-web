export type MailboxMessageCategory = 'sugerencia' | 'consulta' | 'incidencia';

export type MailboxMessageStatus = 'unread' | 'read' | 'resolved';

/**
 * Sin `userId` ni ningún dato de autoría — el anonimato es estructural
 * (docs/permisos-roles.md § Fase 6, CLAUDE.md "Anonymous mailbox"). Ni el
 * backend ni este dominio guardan quién envió el mensaje.
 */
export interface MailboxMessage {
  id: string;
  referenceCode: string;
  category: MailboxMessageCategory;
  body: string;
  status: MailboxMessageStatus;
  createdAt: string;
  reply: string | null;
  resolvedAt: string | null;
}

export interface CreateMailboxMessageInput {
  category: MailboxMessageCategory;
  body: string;
}

export interface CreateMailboxMessageResult {
  referenceCode: string;
}

/** Filtro de la bandeja del admin (deck 12-buzon-recepcion-admin) — `all`
 * no manda `status` en la query. */
export type MailboxMessageFilter = 'unread' | 'all' | 'resolved';

export interface ReplyToMailboxMessageInput {
  body: string;
}
