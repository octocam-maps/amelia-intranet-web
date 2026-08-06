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
interface ManualsLibraryProps {
  /** URL de un manual que la página ya presenta por su cuenta. Se omite de la
   *  lista para no ofrecer el mismo documento dos veces en la misma pantalla:
   *  en Ayuda, el manual de uso de la intranet es la cabecera (con su índice de
   *  capítulos y su versión navegable) y desde la migración 043 está además
   *  registrado en la biblioteca, así que salía repetido. */
  excludeUrl?: string;
}

export function ManualsLibrary({ excludeUrl }: ManualsLibraryProps = {}) {
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

  // Se compara por `url` (`onboarding_documents.storage_ref`) y no por título:
  // el título lo puede editar un admin, la ruta del fichero es la identidad.
  const visible = excludeUrl ? manuals.filter((manual) => manual.url !== excludeUrl) : manuals;

  if (visible.length === 0) {
    // Distinto de "no hay ningún manual": hay uno, y es el que esta página ya
    // muestra arriba. Decir que no hay ninguno sería falso.
    return <p className={styles.empty}>No hay más manuales que el de arriba.</p>;
  }

  return (
    <ul className={styles.list}>
      {visible.map((manual) => (
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
