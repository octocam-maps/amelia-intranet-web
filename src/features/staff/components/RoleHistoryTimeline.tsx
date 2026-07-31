import { USER_ROLE_LABEL } from '@/features/auth/domain/models';
import type { RoleChange } from '../domain/models';
import styles from './RoleHistoryTimeline.module.css';

interface RoleHistoryTimelineProps {
  changes: RoleChange[];
  isLoading: boolean;
  isError: boolean;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Timeline de cambios de rol (`user_role_history`, migración backend 039), de
 * lo más reciente a lo más antiguo — el orden lo da el backend.
 *
 * Es la respuesta a "¿desde cuándo es empleado?" cuando un becario promociona.
 * NO muestra la antigüedad laboral: esa es `hireDate`, vive en la ficha y no
 * cambia nunca.
 */
export function RoleHistoryTimeline({ changes, isLoading, isError }: RoleHistoryTimelineProps) {
  if (isLoading) {
    return <p className={styles.empty}>Cargando el historial de roles…</p>;
  }
  if (isError) {
    return (
      <p className={styles.empty}>
        No se ha podido cargar el historial de roles. Inténtalo de nuevo en unos minutos.
      </p>
    );
  }
  if (changes.length === 0) {
    // No debería pasar: la migración 039 siembra una fila de alta para toda la
    // plantilla y `create_staff_member` la escribe en las altas nuevas. Se
    // cubre igual para no pintar una lista vacía sin explicación.
    return <p className={styles.empty}>Sin cambios de rol registrados.</p>;
  }

  return (
    <ol className={styles.timeline}>
      {changes.map((change) => (
        <li key={change.id} className={styles.item}>
          <span className={styles.dot} aria-hidden="true" />
          <div className={styles.body}>
            <p className={styles.transition}>
              {change.fromRole === null ? (
                // Alta inicial: no venía de ningún rol previo.
                <>
                  Alta como <strong>{USER_ROLE_LABEL[change.toRole]}</strong>
                </>
              ) : (
                <>
                  De <strong>{USER_ROLE_LABEL[change.fromRole]}</strong> a{' '}
                  <strong>{USER_ROLE_LABEL[change.toRole]}</strong>
                </>
              )}
            </p>
            <p className={styles.meta}>
              <time dateTime={change.changedAt}>{formatDateTime(change.changedAt)}</time>
              {' · '}
              {/* `null` = «no consta»: filas reconstruidas por la migración o
                  autor borrado. Se dice tal cual en vez de inventar «Sistema». */}
              {change.changedByName ?? 'autor no registrado'}
            </p>
            {change.note && <p className={styles.note}>{change.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
