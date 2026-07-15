import { parseEnum } from '@/lib/parseEnum';
import type { MailboxMessage, MailboxMessageCategory, MailboxMessageStatus } from '../domain/models';
import type { MailboxMessageDTO } from './dtos';

// `category` se pinta como label (`CATEGORY_LABEL` en MailboxInbox /
// AnonymousMailboxForm); `status` solo se compara con literales, pero un
// valor desconocido colapsando a "unread" evita que un mensaje raro se
// dé por resuelto/leído sin que nadie lo haya revisado.
const MAILBOX_CATEGORIES: MailboxMessageCategory[] = ['sugerencia', 'consulta', 'incidencia'];
const MAILBOX_STATUSES: MailboxMessageStatus[] = ['unread', 'read', 'resolved'];

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
