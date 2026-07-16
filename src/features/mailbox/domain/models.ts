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

/**
 * Estado real que devuelve el backend (`anonymous_messages.status`,
 * 005_admin_comms.sql + 014_mailbox_reply_status.sql): `new` -> `read` al
 * responder -> `resolved` al cerrar. Deliberadamente DISTINTO de
 * `MailboxMessageStatus` ('unread'/'read'/'resolved'): ese tipo modela cómo
 * lo pinta hoy la bandeja del admin, no el valor crudo de la columna. Ver
 * engram "GAP de producto en el buzón anónimo" — el mapper de la bandeja
 * (`messageFromDTO`) ya convive con ese desajuste; el seguimiento del
 * emisor no debe heredarlo.
 */
export type TrackedMailboxMessageStatus = 'new' | 'read' | 'resolved';

/**
 * Respuesta de `GET /mailbox/track/{reference_code}` (sin auth, único canal
 * del emisor anónimo). Forma distinta a `MailboxMessage`: no trae `id`
 * (el emisor no debe poder inferir el id interno de la fila) ni
 * `repliedAt` (el backend no lo expone en este endpoint); usa `adminReply`
 * en vez de `reply` porque así lo nombra el DTO del backend.
 */
export interface TrackedMailboxMessage {
  referenceCode: string;
  category: MailboxMessageCategory;
  subject: string | null;
  body: string;
  status: TrackedMailboxMessageStatus;
  adminReply: string | null;
  createdAt: string;
}
