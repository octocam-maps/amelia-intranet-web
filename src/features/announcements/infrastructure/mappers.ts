import type { Announcement, AnnouncementAudience, AnnouncementInput, AnnouncementStatus } from '../domain/models';
import type { AnnouncementDTO, AnnouncementInputDTO } from './dtos';

export function announcementFromDTO(dto: AnnouncementDTO): Announcement {
  return {
    id: dto.id,
    title: dto.title,
    body: dto.body,
    status: dto.status as AnnouncementStatus,
    pinned: dto.pinned,
    audience: dto.audience as AnnouncementAudience,
    publishedAt: dto.published_at,
    createdAt: dto.created_at,
    viewCount: dto.view_count,
  };
}

export function announcementInputToDTO(input: AnnouncementInput): AnnouncementInputDTO {
  return {
    title: input.title,
    body: input.body,
    audience: input.audience,
    pinned: input.pinned,
    status: input.status,
  };
}

export function partialAnnouncementInputToDTO(input: Partial<AnnouncementInput>): Partial<AnnouncementInputDTO> {
  const dto: Partial<AnnouncementInputDTO> = {};
  if (input.title !== undefined) dto.title = input.title;
  if (input.body !== undefined) dto.body = input.body;
  if (input.audience !== undefined) dto.audience = input.audience;
  if (input.pinned !== undefined) dto.pinned = input.pinned;
  if (input.status !== undefined) dto.status = input.status;
  return dto;
}
