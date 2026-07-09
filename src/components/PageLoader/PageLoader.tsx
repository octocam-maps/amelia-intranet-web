import { Loader2 } from 'lucide-react';
import styles from './PageLoader.module.css';

export function PageLoader() {
  return (
    <div className={styles.root} role="status" aria-busy="true" aria-live="polite">
      <Loader2 className={styles.spinner} aria-label="Cargando" />
    </div>
  );
}
