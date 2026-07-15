import { Cake } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import styles from './UpcomingBirthdaysCard.module.css';

// Fase 5 (módulo Equipo) todavía no existe — no hay endpoint de plantilla
// del que sacar cumpleaños reales. Antes esta card rellenaba la lista con
// nombres inventados (Laia Soler, Jordi Puig, Anna Roig) como si fueran
// datos reales de la empresa — un estado vacío honesto es preferible a
// mostrar personas que no existen. El LAYOUT sigue siendo fiel al deck
// 01/02-home; el contenido real se conecta en cuanto exista `/team`.
export function UpcomingBirthdaysCard({ title = 'Próximos cumpleaños' }: { title?: string }) {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>{title}</CardTitle>
        <Cake className={styles.icon} />
      </CardHeader>
      <CardContent>
        <p className={styles.empty}>Disponible próximamente, con el módulo de Equipo.</p>
      </CardContent>
    </Card>
  );
}
