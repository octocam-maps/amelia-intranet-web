import { CheckCircledIcon, DownloadIcon, ExternalLinkIcon, ReaderIcon } from '@radix-ui/react-icons';
import { useManuals } from '../application/useManuals';
import styles from './ManualsLibrary.module.css';

/**
 * Biblioteca de manuales de consulta (`GET /manuals`, migración backend 043).
 *
 * Se monta DENTRO de la página de Ayuda en vez de en una pantalla propia: el
 * usuario que busca "el manual de X" ya va a Ayuda, y una segunda ruta con
 * documentos habría dividido el mismo material en dos sitios sin decir cuál mirar.
 *
 * Aquí NO hay candados. La lectura obligatoria en orden se exige DENTRO del paso 3
 * del onboarding; en la consulta, bloquear un PDF que alguien necesita para
 * trabajar no protegería nada. Lo que sí se marca es cuáles ya confirmó, porque le
 * dice qué le queda pendiente de su onboarding.
 */
export function ManualsLibrary() {
  const { data: manuals, isLoading, isError } = useManuals();

  if (isLoading) {
    return <p className={styles.empty}>Cargando los manuales…</p>;
  }
  if (isError) {
    return (
      <p className={styles.empty}>
        No se han podido cargar los manuales. Inténtalo de nuevo en unos minutos.
      </p>
    );
  }
  if (!manuals || manuals.length === 0) {
    return <p className={styles.empty}>RRHH todavía no ha publicado ningún manual.</p>;
  }

  return (
    <ul className={styles.list}>
      {manuals.map((manual) => (
        <li key={manual.id} className={styles.item}>
          <span className={styles.iconBox}>
            {manual.acknowledged ? (
              <CheckCircledIcon className={styles.iconDone} />
            ) : (
              <ReaderIcon className={styles.icon} />
            )}
          </span>

          <div className={styles.body}>
            <p className={styles.title}>{manual.title}</p>
            <p className={styles.meta}>
              {manual.requiredInOnboarding
                ? manual.acknowledged
                  ? 'Lectura confirmada en tu onboarding'
                  : 'Lectura obligatoria · pendiente en tu onboarding'
                : 'Documento de consulta'}
            </p>
          </div>

          {manual.url ? (
            <span className={styles.actions}>
              <a className={styles.action} href={manual.url} target="_blank" rel="noreferrer">
                <ExternalLinkIcon className={styles.actionIcon} />
                Abrir
              </a>
              <a className={styles.action} href={manual.url} download>
                <DownloadIcon className={styles.actionIcon} />
                Descargar
              </a>
            </span>
          ) : (
            // Registrado pero sin fichero: se dice, en vez de dejar un enlace muerto.
            <span className={styles.pending}>Sin publicar</span>
          )}
        </li>
      ))}
    </ul>
  );
}
