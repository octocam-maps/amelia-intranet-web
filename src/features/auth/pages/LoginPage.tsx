import { GoogleAuthPanel } from '../components/GoogleAuthPanel';
import { LoginBrandPanel } from '../components/LoginBrandPanel';
import styles from './LoginPage.module.css';

// Placeholder — sin sistema de tickets de RRHH todavía; actualizar cuando exista.
const RRHH_CONTACT_EMAIL = 'rrhh@ameliahub.com';

export function LoginPage() {
  return (
    <div className={styles.page}>
      <LoginBrandPanel />

      <div className={styles.actionPanel}>
        <div />

        <div className={styles.actionBody}>
          <h2 className={styles.title}>Hola de nuevo</h2>
          <p className={styles.subtitle}>Inicia sesión con tu cuenta corporativa de Google.</p>

          <div className={styles.action}>
            <GoogleAuthPanel />
          </div>
        </div>

        <p className={styles.contact}>
          ¿Problemas para entrar?{' '}
          <a href={`mailto:${RRHH_CONTACT_EMAIL}`} className={styles.contactLink}>
            Escribe a RRHH
          </a>
        </p>
      </div>
    </div>
  );
}
