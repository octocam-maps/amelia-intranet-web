export type AnnouncementStatus = 'draft' | 'published';

/** El deck (11-anuncios.png) solo ofrece "Toda la plantilla" en el selector
 * de destinatarios — se deja como string en vez de un enum cerrado para no
 * romper si el backend añade segmentación por entidad más adelante. */
export type AnnouncementAudience = 'all';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  pinned: boolean;
  audience: AnnouncementAudience;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  pinned: boolean;
  status: AnnouncementStatus;
}
