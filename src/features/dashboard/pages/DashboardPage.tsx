import { useStore } from '@/store';
import styles from './DashboardPage.module.css';

/**
 * Placeholder mínimo — solo para verificar que el Shell (Sidebar + Topbar +
 * rol) funciona de punta a punta. Los widgets reales (fichaje, ausencias,
 * bandeja de aprobaciones del admin, etc.) llegan en la Fase 3.
 */
export function DashboardPage() {
  const user = useStore((s) => s.user);
  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Hola, {firstName}</h1>
      <p className={styles.subtitle}>
        Sesión iniciada como <strong>{user?.role}</strong>. Este dashboard es un
        placeholder de la Fase 1 — confirma que el Shell y el rol funcionan
        correctamente de extremo a extremo.
      </p>
    </div>
  );
}
