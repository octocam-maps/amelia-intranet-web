import { NetworkIcon } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './TeamOrgChartPlaceholder.module.css';

/**
 * deck-fase5/08-equipo-organigrama.png — el usuario pidió explícitamente NO
 * cablear el árbol real hasta que RRHH confirme la estructura de mando
 * (manager_id). Este estado vacío deja el hueco visual reservado en la
 * navegación sin inventar jerarquías.
 */
export function TeamOrgChartPlaceholder() {
  return (
    <Card>
      <CardContent className={styles.root}>
        <span className={styles.iconWrap}>
          <NetworkIcon className={styles.icon} />
        </span>
        <h2 className={styles.title}>Organigrama disponible próximamente</h2>
        <p className={styles.description}>
          Se activará en cuanto RRHH facilite la estructura jerárquica del grupo Amelia.
        </p>
      </CardContent>
    </Card>
  );
}
