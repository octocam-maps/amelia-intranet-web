import { parseEnum } from '@/lib/parseEnum';
import type {
  MailboxMessage,
  MailboxMessageCategory,
  MailboxMessageStatus,
  TrackedMailboxMessage,
  TrackedMailboxMessageStatus,
} from '../domain/models';
import type { MailboxMessageDTO, TrackMessageDTO } from './dtos';

// `category` se pinta como label (`CATEGORY_LABEL` en MailboxInbox /
// AnonymousMailboxForm); `status` solo se compara con literales, pero un
// valor desconocido colapsando a "unread" evita que un mensaje raro se
// dé por resuelto/leído sin que nadie lo haya revisado.
const MAILBOX_CATEGORIES: MailboxMessageCategory[] = ['sugerencia', 'consulta', 'incidencia'];
const MAILBOX_STATUSES: MailboxMessageStatus[] = ['unread', 'read', 'resolved'];
const TRACKED_MAILBOX_STATUSES: TrackedMailboxMessageStatus[] = ['new', 'read', 'resolved'];

export function messageFromDTO(dto: MailboxMessageDTO): MailboxMessage {
  return {
    id: dto.id,
    referenceCode: dto.reference_code,
    category: parseEnum(dto.category, MAILBOX_CATEGORIES, 'consulta'),
    body: dto.body,
    status: parseEnum(dto.status, MAILBOX_STATUSES, 'unread'),
    createdAt: dto.created_at,
    reply: dto.reply,
    resolvedAt: dto.resolved_at,
  };
}

/** `status` usa aquí el valor crudo de la columna (`new`/`read`/`resolved`)
 * — a diferencia de `messageFromDTO`, no hay que traducirlo a lo que pinta
 * la bandeja del admin, así que el fallback natural es `'new'`. */
export function trackedMessageFromDTO(dto: TrackMessageDTO): TrackedMailboxMessage {
  return {
    referenceCode: dto.reference_code,
    category: parseEnum(dto.category, MAILBOX_CATEGORIES, 'consulta'),
    subject: dto.subject,
    body: dto.body,
    status: parseEnum(dto.status, TRACKED_MAILBOX_STATUSES, 'new'),
    adminReply: dto.admin_reply,
    createdAt: dto.created_at,
  };
}
