import type { NotificationPage } from './models';

export interface NotificationsRepository {
  /** El backend filtra por el usuario del JWT — nunca hay que pasar user_id. */
  list(before?: string): Promise<NotificationPage>;
  unreadCount(): Promise<number>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<number>;
}
