import { MessageSquareText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './AnonymousMailboxCard.module.css';

/** Tarjeta oscura del deck 01-home-empleado. Fase 6: la ruta
 * `/buzon-anonimo` ya existe — el botón deja de estar deshabilitado. */
export function AnonymousMailboxCard() {
  return (
    <Card className={styles.dark}>
      <CardContent>
        <div className={styles.icon}>
          <MessageSquareText />
        </div>
        <p className={styles.title}>Buzón anónimo</p>
        <p className={styles.body}>Envía una sugerencia o consulta a RRHH sin identificarte.</p>
        <Button className={styles.button} asChild>
          <Link to="/buzon-anonimo">Escribir mensaje</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
