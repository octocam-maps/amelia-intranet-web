import { Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAnnouncements } from '@/features/announcements/application/useAnnouncements';
import { AnnouncementBody } from '@/features/announcements/components/AnnouncementBody';
import styles from './AnnouncementsCard.module.css';

const MAX_ITEMS = 3;

// docs/deck-fase6/01-home-empleado — el backend ya filtra por rol (el
// empleado solo recibe anuncios publicados); aquí solo se recorta a los
// primeros `MAX_ITEMS` para que la tarjeta no crezca sin límite.
export function AnnouncementsCard() {
  const { data: announcements = [], isLoading } = useAnnouncements();
  const items = announcements.slice(0, MAX_ITEMS);

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Anuncios</CardTitle>
        <Megaphone className={styles.icon} />
      </CardHeader>
      <CardContent className={styles.list}>
        {isLoading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : items.length === 0 ? (
          <p className={styles.empty}>No hay anuncios por ahora.</p>
        ) : (
          items.map((announcement) => (
            <div key={announcement.id} className={styles.item}>
              <p className={styles.title}>{announcement.title}</p>
              <div className={styles.body}>
                <AnnouncementBody body={announcement.body} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
