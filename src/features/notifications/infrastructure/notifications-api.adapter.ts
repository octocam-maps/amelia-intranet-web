import { apiClient } from '@/lib/http/api-client';
import type { NotificationPage } from '../domain/models';
import type { NotificationsRepository } from '../domain/ports';
import type { MarkAllReadDTO, NotificationListDTO, UnreadCountDTO } from './dtos';
import { notificationPageFromDTO } from './mappers';

export const notificationsApiAdapter: NotificationsRepository = {
  async list(before?: string): Promise<NotificationPage> {
    const params = new URLSearchParams({ limit: '20' });
    if (before) params.set('before', before);
    const dto = await apiClient<NotificationListDTO>(`/notifications?${params.toString()}`);
    return notificationPageFromDTO(dto);
  },

  async unreadCount(): Promise<number> {
    const dto = await apiClient<UnreadCountDTO>('/notifications/unread-count');
    return dto.count;
  },

  async markRead(id: string): Promise<void> {
    await apiClient<void>(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  async markAllRead(): Promise<number> {
    const dto = await apiClient<MarkAllReadDTO>('/notifications/read-all', { method: 'PATCH' });
    return dto.updated;
  },
};
