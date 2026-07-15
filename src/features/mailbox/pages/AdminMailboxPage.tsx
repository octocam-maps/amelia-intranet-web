import { MailboxInbox } from '../components/MailboxInbox';
import styles from './AdminMailboxPage.module.css';

/** deck-fase6/12-buzon-recepcion-admin.png */
export function AdminMailboxPage() {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Buzón anónimo</h1>
        <p className={styles.subtitle}>Mensajes recibidos sin identidad del remitente</p>
      </div>

      <MailboxInbox />
    </div>
  );
}
