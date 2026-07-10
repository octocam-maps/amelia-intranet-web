import dataBooth from '@/assets/login/data-booth.jpg';
import teamField from '@/assets/login/team-field.jpg';
import teamOffice from '@/assets/login/team-office.jpg';
import teamSmiling from '@/assets/login/team-smiling.jpg';
import { GoogleAuthPanel } from '../components/GoogleAuthPanel';
import { LoginBrandPanel } from '../components/LoginBrandPanel';
import styles from './LoginPage.module.css';

// Cambio de la demo (2026-07-09): buzón real de People, ya no placeholder.
const RRHH_CONTACT_EMAIL = 'people@ameliahub.com';

// Fondo del panel derecho: crossfade suave entre fotos reales del equipo
// (colaborando, sonriendo, en campo) y el stand con gráficas de datos. El
// orden arranca por la foto más "cálida" (equipo sonriendo).
const BACKDROP_IMAGES = [teamSmiling, teamOffice, teamField, dataBooth];
const CROSSFADE_STEP_SECONDS = 5;

export function LoginPage() {
  return (
    <div className={styles.page}>
      <LoginBrandPanel />

      <div className={styles.actionPanel}>
        <div className={styles.backdrop} aria-hidden="true">
          {BACKDROP_IMAGES.map((src, index) => (
            <div
              key={src}
              className={styles.backdropLayer}
              style={{
                backgroundImage: `url(${src})`,
                animationDelay: `${index * CROSSFADE_STEP_SECONDS}s`,
              }}
            />
          ))}
          <div className={styles.scrim} />
        </div>

        <div className={styles.foreground}>
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
    </div>
  );
}
