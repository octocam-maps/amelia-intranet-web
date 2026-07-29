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
          {/* NO repetir "Buzón anónimo": el Topbar ya lo imprime como `<h1>`
              (es el label del ítem de navegación, vía `pageTitleForPath`) y
              aquí quedaba el mismo texto palabra por palabra, sin matiz. El
              rótulo dice QUÉ haces, igual que "Seguimiento de tu mensaje" en
              `MailboxTrackingPage`, que es la otra cosa que puedes hacer en
              esta misma ruta. */}
          <p className={styles.title}>Nuevo mensaje</p>
        </div>
        <CardContent className={styles.body}>
          <AnonymousMailboxForm />
        </CardContent>
      </Card>
    </div>
  );
}
