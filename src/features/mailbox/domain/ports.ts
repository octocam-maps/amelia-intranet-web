import type {
  CreateMailboxMessageInput,
  CreateMailboxMessageResult,
  MailboxMessage,
  MailboxMessageFilter,
  ReplyToMailboxMessageInput,
} from './models';

export interface MailboxRepository {
  createMessage(input: CreateMailboxMessageInput): Promise<CreateMailboxMessageResult>;
  listMessages(filter?: MailboxMessageFilter): Promise<MailboxMessage[]>;
  replyToMessage(messageId: string, input: ReplyToMailboxMessageInput): Promise<MailboxMessage>;
  resolveMessage(messageId: string): Promise<MailboxMessage>;
}
