import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAnnouncements } from '../application/useAnnouncements';
import { AnnouncementFormPanel } from '../components/AnnouncementFormPanel';
import { AnnouncementsList } from '../components/AnnouncementsList';
import type { Announcement } from '../domain/models';
import styles from './AnunciosPage.module.css';

/** deck-fase6/11-anuncios.png — listado a la izquierda, panel de alta/edición
 * persistente a la derecha (no es un diálogo modal). */
export function AnunciosPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: announcements = [], isLoading } = useAnnouncements();
  const selected = announcements.find((a) => a.id === selectedId) ?? null;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Anuncios</h1>
          <p className={styles.subtitle}>Comunicados para toda la plantilla</p>
        </div>
        <Button onClick={() => setSelectedId(null)}>
          <Plus />
          Nuevo anuncio
        </Button>
      </div>

      <div className={styles.grid}>
        <AnnouncementsList
          announcements={announcements}
          isLoading={isLoading}
          selectedId={selectedId}
          onSelect={(announcement: Announcement) => setSelectedId(announcement.id)}
        />
        <AnnouncementFormPanel announcement={selected ?? undefined} onSaved={() => setSelectedId(null)} />
      </div>
    </div>
  );
}
