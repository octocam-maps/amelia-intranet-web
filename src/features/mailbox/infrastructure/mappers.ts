import type { MailboxMessage, MailboxMessageCategory, MailboxMessageStatus } from '../domain/models';
import type { MailboxMessageDTO } from './dtos';

export function messageFromDTO(dto: MailboxMessageDTO): MailboxMessage {
  return {
    id: dto.id,
    referenceCode: dto.reference_code,
    category: dto.category as MailboxMessageCategory,
    body: dto.body,
    status: dto.status as MailboxMessageStatus,
    createdAt: dto.created_at,
    reply: dto.reply,
    resolvedAt: dto.resolved_at,
  };
}
