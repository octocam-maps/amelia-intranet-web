import styles from './PageLoader.module.css';

export function PageLoader() {
  return (
    <div
      className={styles.root}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Cargando"
    >
      <span className={styles.spinner} aria-hidden="true" />
    </div>
  );
}
