import { apiClient } from '@/lib/http/api-client';
import type {
  CreateMailboxMessageInput,
  CreateMailboxMessageResult,
  MailboxMessage,
  MailboxMessageFilter,
  ReplyToMailboxMessageInput,
} from '../domain/models';
import type { MailboxRepository } from '../domain/ports';
import type { CreateMailboxMessageResultDTO, MailboxMessageDTO, MailboxMessageListDTO } from './dtos';
import { messageFromDTO } from './mappers';

export const mailboxApiAdapter: MailboxRepository = {
  async createMessage(input: CreateMailboxMessageInput): Promise<CreateMailboxMessageResult> {
    const dto = await apiClient<CreateMailboxMessageResultDTO>('/mailbox/messages', {
      method: 'POST',
      body: JSON.stringify({ category: input.category, body: input.body }),
    });
    return { referenceCode: dto.reference_code };
  },

  async listMessages(filter: MailboxMessageFilter = 'all'): Promise<MailboxMessage[]> {
    const dto = await apiClient<MailboxMessageListDTO>(
      `/mailbox/messages${filter !== 'all' ? `?status=${filter}` : ''}`
    );
    return dto.messages.map(messageFromDTO);
  },

  async replyToMessage(messageId: string, input: ReplyToMailboxMessageInput): Promise<MailboxMessage> {
    const dto = await apiClient<MailboxMessageDTO>(`/mailbox/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body: input.body }),
    });
    return messageFromDTO(dto);
  },

  async resolveMessage(messageId: string): Promise<MailboxMessage> {
    const dto = await apiClient<MailboxMessageDTO>(`/mailbox/messages/${messageId}/resolve`, {
      method: 'POST',
    });
    return messageFromDTO(dto);
  },
};
