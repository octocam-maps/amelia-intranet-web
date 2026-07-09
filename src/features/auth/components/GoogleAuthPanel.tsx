import { Loader2 } from 'lucide-react';
import { useGoogleOneTap } from '../application/useGoogleOneTap';
import styles from './GoogleAuthPanel.module.css';

/**
 * Zona de acción de auth del panel derecho del login. No es solo un botón:
 * es un pequeño estado — "comprobando sesión" mientras Google decide si
 * puede auto-entrar, y solo si no puede, el botón oficial como respaldo.
 * Evita el flash de un botón que va a desaparecer solo en la mayoría de
 * los casos (usuario ya logueado en Google con una única cuenta).
 */
export function GoogleAuthPanel() {
  const { stage, isError, isConfigured, buttonContainerRef } = useGoogleOneTap();

  if (!isConfigured) {
    return (
      <p className={styles.warning}>
        Falta configurar <code>VITE_GOOGLE_CLIENT_ID</code> en el entorno.
      </p>
    );
  }

  return (
    <div className={styles.root}>
      {(stage === 'checking' || stage === 'authenticating') && (
        <div className={styles.status}>
          <Loader2 className={styles.spinner} aria-hidden />
          {stage === 'checking' ? 'Comprobando tu sesión de Google…' : 'Iniciando sesión…'}
        </div>
      )}

      {/* Se mantiene montado (solo oculto) para que Google pueda pintar el
          botón oficial ahí en cuanto decida que One Tap no aplica. */}
      <div ref={buttonContainerRef} hidden={stage !== 'awaiting-action'} />

      {stage === 'awaiting-action' && isError && (
        <p className={styles.error}>No se pudo iniciar sesión. Inténtalo de nuevo o escribe a RRHH.</p>
      )}
    </div>
  );
}
