import type { Notification, NotificationPage } from '../domain/models';
import type { NotificationDTO, NotificationListDTO } from './dtos';

export function notificationFromDTO(dto: NotificationDTO): Notification {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    body: dto.body,
    url: dto.data?.url ?? null,
    read: dto.read,
    createdAt: dto.created_at,
  };
}

export function notificationPageFromDTO(dto: NotificationListDTO): NotificationPage {
  return {
    items: dto.items.map(notificationFromDTO),
    nextBefore: dto.next_before,
  };
}
