import type { Announcement, AnnouncementInput } from './models';

export interface AnnouncementsRepository {
  /** El backend filtra por rol: el admin ve todos los estados, el empleado
   * solo los publicados (docs/permisos-roles.md — filtrado en backend). */
  list(): Promise<Announcement[]>;
  create(input: AnnouncementInput): Promise<Announcement>;
  update(id: string, input: Partial<AnnouncementInput>): Promise<Announcement>;
  remove(id: string): Promise<void>;
}
