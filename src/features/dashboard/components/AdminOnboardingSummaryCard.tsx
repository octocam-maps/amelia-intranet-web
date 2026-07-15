import { UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { BadgeProps } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useOnboardingProgress } from '@/features/onboarding/admin/application/useOnboardingProgress';
import type { OnboardingProgressStatus } from '@/features/onboarding/admin/domain/models';
import styles from './AdminOnboardingSummaryCard.module.css';

const MAX_ITEMS = 3;

const STATUS_LABEL: Record<OnboardingProgressStatus, string> = {
  not_started: 'Sin empezar',
  in_progress: 'En curso',
  completed: 'Completado',
};

const STATUS_VARIANT: Record<OnboardingProgressStatus, BadgeProps['variant']> = {
  not_started: 'outline',
  in_progress: 'warning',
  completed: 'success',
};

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/**
 * "Estado de onboarding de nuevos ingresos" de la columna derecha del Home
 * admin — reutiliza `useOnboardingProgress` (feature `onboarding/admin`, ver
 * `OnboardingAdminPage`): solo se muestran los que aún no completaron, para
 * que la tarjeta apunte a quién necesita seguimiento.
 */
export function AdminOnboardingSummaryCard() {
  const { data: employees = [], isLoading } = useOnboardingProgress();
  const notStarted = employees.filter((e) => e.status === 'not_started').length;
  const inProgress = employees.filter((e) => e.status === 'in_progress').length;
  const completed = employees.filter((e) => e.status === 'completed').length;
  const pending = employees.filter((e) => e.status !== 'completed').slice(0, MAX_ITEMS);

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Onboarding en curso</CardTitle>
        <UserPlus className={styles.headerIcon} />
      </CardHeader>
      <CardContent className={styles.content}>
        {isLoading ? (
          <p className={styles.empty}>Cargando…</p>
        ) : (
          <>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <p className={styles.statValue}>{inProgress}</p>
                <p className={styles.statLabel}>En curso</p>
              </div>
              <div className={styles.stat}>
                <p className={styles.statValue}>{notStarted}</p>
                <p className={styles.statLabel}>Sin empezar</p>
              </div>
              <div className={styles.stat}>
                <p className={styles.statValue}>{completed}</p>
                <p className={styles.statLabel}>Completado</p>
              </div>
            </div>

            {pending.length === 0 ? (
              <p className={styles.empty}>Toda la plantilla ha completado el onboarding.</p>
            ) : (
              <ul className={styles.list}>
                {pending.map((employee) => (
                  <li key={employee.userId} className={styles.row}>
                    <Avatar className={styles.avatar}>
                      {employee.avatarUrl && <AvatarImage src={employee.avatarUrl} alt={employee.fullName} />}
                      <AvatarFallback>{initialsOf(employee.fullName)}</AvatarFallback>
                    </Avatar>
                    <span className={styles.name}>{employee.fullName}</span>
                    <Badge variant={STATUS_VARIANT[employee.status]}>{STATUS_LABEL[employee.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}

            <Link to="/administracion/onboarding" className={styles.link}>
              Ver todo el onboarding
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
