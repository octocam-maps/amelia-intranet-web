import { Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import styles from './AnnouncementsCard.module.css';

// El panel de admin (anuncios) es Fase 5 — no hay endpoint todavía.
// Placeholder explícito (mismo criterio que Cumpleaños/Buzón): el LAYOUT es
// fiel al deck 01-home-empleado, el contenido se sustituye cuando exista.
const PLACEHOLDER_ANNOUNCEMENTS = [
  { title: 'Offsite de verano', body: 'Confirma tu asistencia antes del 10 jul.' },
  { title: 'Nueva política de teletrabajo', body: 'En vigor desde agosto.' },
];

export function AnnouncementsCard() {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Anuncios</CardTitle>
        <Megaphone className={styles.icon} />
      </CardHeader>
      <CardContent className={styles.list}>
        {PLACEHOLDER_ANNOUNCEMENTS.map((announcement) => (
          <div key={announcement.title} className={styles.item}>
            <p className={styles.title}>{announcement.title}</p>
            <p className={styles.body}>{announcement.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
