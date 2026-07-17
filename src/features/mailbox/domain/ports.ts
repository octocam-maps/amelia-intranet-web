import type {
  CreateMailboxMessageInput,
  CreateMailboxMessageResult,
  MailboxMessage,
  MailboxMessageFilter,
  ReplyToMailboxMessageInput,
  TrackedMailboxMessage,
} from './models';

export interface MailboxRepository {
  createMessage(input: CreateMailboxMessageInput): Promise<CreateMailboxMessageResult>;
  listMessages(filter?: MailboxMessageFilter): Promise<MailboxMessage[]>;
  replyToMessage(messageId: string, input: ReplyToMailboxMessageInput): Promise<MailboxMessage>;
  resolveMessage(messageId: string): Promise<MailboxMessage>;
  /** `GET /mailbox/track/{reference_code}`, sin auth — el `reference_code`
   * ES la credencial de seguimiento del emisor anónimo, no se le pide
   * ningún otro dato. */
  trackMessage(referenceCode: string): Promise<TrackedMailboxMessage>;
}
