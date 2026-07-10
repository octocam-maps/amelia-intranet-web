import { Calendar, Eye, MoreHorizontal, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { useDeleteAnnouncement } from '../application/useDeleteAnnouncement';
import { useUpdateAnnouncement } from '../application/useUpdateAnnouncement';
import type { Announcement } from '../domain/models';
import { AnnouncementBody } from './AnnouncementBody';
import styles from './AnnouncementsList.module.css';

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
}

interface AnnouncementsListProps {
  announcements: Announcement[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (announcement: Announcement) => void;
}

/** deck-fase6/11-anuncios.png § columna izquierda. */
export function AnnouncementsList({ announcements, isLoading, selectedId, onSelect }: AnnouncementsListProps) {
  const { mutate: updateAnnouncement } = useUpdateAnnouncement();
  const { mutate: deleteAnnouncement } = useDeleteAnnouncement();

  if (isLoading) {
    return <p className={styles.empty}>Cargando anuncios…</p>;
  }
  if (announcements.length === 0) {
    return <p className={styles.empty}>Todavía no se ha publicado ningún anuncio.</p>;
  }

  const handleDelete = (announcement: Announcement) => {
    if (window.confirm(`¿Eliminar el anuncio "${announcement.title}"?`)) {
      deleteAnnouncement(announcement.id);
    }
  };

  return (
    <div className={styles.list}>
      {announcements.map((announcement) => (
        <article
          key={announcement.id}
          role="button"
          tabIndex={0}
          className={cn(styles.card, selectedId === announcement.id && styles.cardActive)}
          onClick={() => onSelect(announcement)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(announcement);
            }
          }}
        >
          <div className={styles.cardHeader}>
            <div className={styles.badges}>
              {announcement.pinned && <Badge variant="warning">Fijado</Badge>}
              <Badge variant={announcement.status === 'published' ? 'success' : 'outline'}>
                {announcement.status === 'published' ? 'Publicado' : 'Borrador'}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={styles.menuButton}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Más acciones para ${announcement.title}`}
                >
                  <MoreHorizontal />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => onSelect(announcement)}>Editar</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateAnnouncement({ id: announcement.id, input: { pinned: !announcement.pinned } })}
                >
                  {announcement.pinned ? 'Desfijar' : 'Fijar en el dashboard'}
                </DropdownMenuItem>
                {announcement.status === 'draft' && (
                  <DropdownMenuItem
                    onClick={() => updateAnnouncement({ id: announcement.id, input: { status: 'published' } })}
                  >
                    Publicar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleDelete(announcement)}>Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 className={styles.cardTitle}>{announcement.title}</h3>
          <div className={styles.cardBody}>
            <AnnouncementBody body={announcement.body} />
          </div>

          <div className={styles.cardMeta}>
            <span>
              <Calendar /> {formatFullDate(announcement.publishedAt ?? announcement.createdAt)}
            </span>
            <span>
              <Users /> Toda la plantilla
            </span>
            <span>
              <Eye /> {announcement.viewCount} vistas
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
