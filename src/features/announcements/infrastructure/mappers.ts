import { parseEnum, parseEnumNullable } from '@/lib/parseEnum';
import type { Announcement, AnnouncementAudience, AnnouncementEntity, AnnouncementInput } from '../domain/models';
import type { AnnouncementDTO, AnnouncementInputDTO } from './dtos';

// `audience` decide si se muestra el selector de entidad; `entityCode` se
// renderiza como badge (`ENTITY_LABEL[entityCode]` en AnnouncementsList).
const ANNOUNCEMENT_AUDIENCES: AnnouncementAudience[] = ['all', 'entity'];
const ANNOUNCEMENT_ENTITIES: AnnouncementEntity[] = ['hub', 'lab', 'ops'];

export function announcementFromDTO(dto: AnnouncementDTO): Announcement {
  return {
    id: dto.id,
    title: dto.title,
    body: dto.body,
    // El backend no envía `status`: se deriva de `published_at`.
    status: dto.published_at ? 'published' : 'draft',
    pinned: dto.is_pinned,
    audience: parseEnum(dto.audience, ANNOUNCEMENT_AUDIENCES, 'all'),
    entityCode: parseEnumNullable(dto.entity_code, ANNOUNCEMENT_ENTITIES),
    publishedAt: dto.published_at,
    createdAt: dto.created_at,
    // El backend aún no registra vistas (no hay columna view_count); se
    // deja en 0 hasta que exista el conteo real.
    viewCount: 0,
  };
}

export function announcementInputToDTO(input: AnnouncementInput): AnnouncementInputDTO {
  return {
    title: input.title,
    body: input.body,
    audience: input.audience,
    entity: input.audience === 'entity' ? input.entity ?? null : null,
    is_pinned: input.pinned,
    published: input.status === 'published',
  };
}

export function partialAnnouncementInputToDTO(input: Partial<AnnouncementInput>): Partial<AnnouncementInputDTO> {
  const dto: Partial<AnnouncementInputDTO> = {};
  if (input.title !== undefined) dto.title = input.title;
  if (input.body !== undefined) dto.body = input.body;
  if (input.audience !== undefined) {
    dto.audience = input.audience;
    dto.entity = input.audience === 'entity' ? input.entity ?? null : null;
  }
  if (input.pinned !== undefined) dto.is_pinned = input.pinned;
  if (input.status !== undefined) dto.published = input.status === 'published';
  return dto;
}
