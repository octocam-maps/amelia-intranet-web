import { MailboxInbox } from '../components/MailboxInbox';
import styles from './AdminMailboxPage.module.css';

/** deck-fase6/12-buzon-recepcion-admin.png */
export function AdminMailboxPage() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Buzón anónimo</h2>
        <p className={styles.subtitle}>Mensajes recibidos sin identidad del remitente</p>
      </div>

      <MailboxInbox />
    </div>
  );
}
