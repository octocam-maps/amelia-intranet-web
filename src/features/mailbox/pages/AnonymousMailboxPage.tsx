import { ChatBubbleIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/Card';
import { AnonymousMailboxForm } from '../components/AnonymousMailboxForm';
import styles from './AnonymousMailboxPage.module.css';

/** deck-fase6/13-buzon-empleado.png — tarjeta centrada de ancho fijo, no un
 * layout de página completa: el foco es solo el formulario. */
export function AnonymousMailboxPage() {
  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <div className={styles.icon}>
            <ChatBubbleIcon />
          </div>
          <p className={styles.title}>Buzón anónimo</p>
        </div>
        <CardContent className={styles.body}>
          <AnonymousMailboxForm />
        </CardContent>
      </Card>
    </div>
  );
}
