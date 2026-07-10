export type AnnouncementStatus = 'draft' | 'published';

/** Segmentación por entidad del grupo (Hub/Lab/Ops). El backend también
 * admite `role`, pero la UI no lo usa por ahora. */
export type AnnouncementEntity = 'hub' | 'lab' | 'ops';

export type AnnouncementAudience = 'all' | 'entity';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  pinned: boolean;
  audience: AnnouncementAudience;
  entityCode: AnnouncementEntity | null;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  entity?: AnnouncementEntity | null;
  pinned: boolean;
  status: AnnouncementStatus;
}
