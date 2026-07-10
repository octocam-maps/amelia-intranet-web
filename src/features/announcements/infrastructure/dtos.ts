/** Formas snake_case tal cual las devuelve / acepta el backend (Pydantic).
 *
 * El backend NO tiene un campo `status`: el estado borrador/publicado se
 * expresa con `published_at` (null = borrador). En escritura acepta
 * `published: bool` e `is_pinned: bool`. Traducir a/desde el modelo de
 * dominio (`status`/`pinned`) ocurre en `mappers.ts`. */

export interface AnnouncementDTO {
  id: string;
  title: string;
  body: string;
  audience: string;
  entity_code: string | null;
  is_pinned: boolean;
  published_at: string | null;
  created_at: string;
}

export interface AnnouncementListDTO {
  announcements: AnnouncementDTO[];
}

export interface AnnouncementInputDTO {
  title: string;
  body: string;
  audience: string;
  entity?: string | null;
  is_pinned: boolean;
  published: boolean;
}
