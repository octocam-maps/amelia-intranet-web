import { MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './AnonymousMailboxCard.module.css';

/** Tarjeta oscura del deck 01-home-empleado. El buzón anónimo es Fase 6
 * (`docs/permisos-roles.md`) — el botón queda deshabilitado hasta que la
 * ruta `/buzon-anonimo` exista, en línea con el ítem "comingSoon" del navbar. */
export function AnonymousMailboxCard() {
  return (
    <Card className={styles.dark}>
      <CardContent>
        <div className={styles.icon}>
          <MessageSquareText />
        </div>
        <p className={styles.title}>Buzón anónimo</p>
        <p className={styles.body}>Envía una sugerencia o consulta a RRHH sin identificarte.</p>
        <Button className={styles.button} disabled title="Disponible en Fase 6">
          Escribir mensaje
        </Button>
      </CardContent>
    </Card>
  );
}
