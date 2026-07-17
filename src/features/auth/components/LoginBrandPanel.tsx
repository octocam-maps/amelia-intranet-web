import logoBlanco from '@/assets/brand/logo-amelia-blanco.png';
import { CheckIcon } from '@radix-ui/react-icons';
import styles from './LoginBrandPanel.module.css';

const BULLETS = [
  'Onboarding guiado, paso a paso',
  'Vacaciones, fichajes y nóminas a un clic',
  'Tu equipo y la empresa, siempre a mano',
];

/**
 * Panel izquierdo de marca (boceto Fase 1 · Acceso). En móvil se colapsa a
 * una banda compacta (logo + titular) para no empujar la acción de login
 * fuera de la primera pantalla — subtítulo, bullets y footer solo aparecen
 * desde el breakpoint `md` en adelante, cuando ya hay sitio de sobra.
 */
export function LoginBrandPanel() {
  return (
    <div className={styles.panel}>
      {/* Único acento de color fuerte de la pantalla: un glow ambiental de
          marca, no una animación llamativa. */}
      <div aria-hidden className={styles.glow} />

      <div className={styles.logoRow}>
        <img src={logoBlanco} alt="Amelia" className={styles.logo} />
      </div>

      <div className={styles.body}>
        <h1 className={styles.title}>Bienvenido a tu espacio de trabajo.</h1>
        <p className={styles.subtitle}>
          Onboarding, vacaciones, fichajes, nóminas y tu equipo. Todo lo de RRHH, en un solo sitio.
        </p>

        <ul className={styles.bullets}>
          {BULLETS.map((bullet, index) => (
            <li
              key={bullet}
              className={styles.bulletItem}
              style={{ animationDelay: `${150 + index * 120}ms` }}
            >
              <span className={styles.bulletCheck}>
                <CheckIcon className={styles.checkIcon} />
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.footer}>Amelia Hub · Amelia Lab · Amelia Ops</p>
    </div>
  );
}
