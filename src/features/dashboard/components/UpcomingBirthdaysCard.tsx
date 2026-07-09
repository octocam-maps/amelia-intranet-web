import { Cake } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import styles from './UpcomingBirthdaysCard.module.css';

// Fase 5 (módulo Equipo) todavía no existe — no hay endpoint de plantilla
// del que sacar cumpleaños reales. Placeholder explícito (mismo criterio que
// el encargo para Anuncios/Buzón/Organigrama): el LAYOUT es fiel al deck
// 01/02-home, el contenido se sustituye en cuanto exista `/team`.
const PLACEHOLDER_BIRTHDAYS = [
  { initials: 'LS', name: 'Laia Soler', day: '9 jul' },
  { initials: 'JP', name: 'Jordi Puig', day: '21 jul' },
  { initials: 'AR', name: 'Anna Roig', day: '28 jul' },
];

export function UpcomingBirthdaysCard({ title = 'Próximos cumpleaños' }: { title?: string }) {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>{title}</CardTitle>
        <Cake className={styles.icon} />
      </CardHeader>
      <CardContent>
        <ul className={styles.list}>
          {PLACEHOLDER_BIRTHDAYS.map((person) => (
            <li key={person.name} className={styles.row}>
              <Avatar className={styles.avatar}>
                <AvatarFallback>{person.initials}</AvatarFallback>
              </Avatar>
              <span className={styles.name}>{person.name}</span>
              <span className={styles.day}>{person.day}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
