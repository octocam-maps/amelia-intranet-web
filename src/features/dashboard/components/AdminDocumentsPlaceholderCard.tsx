import { Link } from 'react-router-dom';
import { ArchiveIcon, FileTextIcon } from '@radix-ui/react-icons';
import styles from './AdminDocumentsPlaceholderCard.module.css';

/**
 * Pestaña "Documentos" del Home admin.
 *
 * El nombre dice "Placeholder" y lo era: anunciaba que "la gestión de documentos
 * y la integración con Google Drive llegan en la Fase 4". La Fase 4 está en
 * producción —hay página de administración, subida manual y "Sincronizar ahora"
 * contra Drive—, así que la pestaña daba por futuro lo que ya existe y dejaba al
 * admin sin vía para llegar. Mismo defecto que el "· próximamente" de la tarjeta
 * de Equipo en el onboarding: un control muerto se lee como una avería.
 *
 * No muestra cifras a propósito: `dashboard/summary` no proyecta nada de
 * documentos, e inventar un recuento aquí sería el defecto de al lado (el mismo
 * que el ámbito rotatorio de "Próximos festivos"). Lo que hacía falta era la
 * puerta a la vista que sí tiene el dato real.
 */
export function AdminDocumentsPlaceholderCard() {
  return (
    <div className={styles.root}>
      <FileTextIcon className={styles.icon} />
      <p className={styles.title}>Gestión de documentos</p>
      <p className={styles.body}>
        Sube nóminas, contratos y documentación de la plantilla, o sincroniza la carpeta de Google
        Drive.
      </p>
      <Link to="/administracion/documentos" className={styles.action}>
        <ArchiveIcon />
        Ir a Documentos
      </Link>
    </div>
  );
}
