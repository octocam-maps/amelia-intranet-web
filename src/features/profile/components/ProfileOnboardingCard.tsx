import { CheckCircle2, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useMyOnboarding } from '@/features/onboarding/application/useMyOnboarding';
import styles from './ProfileOnboardingCard.module.css';

/**
 * `GET /onboarding/me` ya llega filtrado por rol (deck Fase 2): un
 * externo-invitado ve 2 pasos (vídeo + manual) en vez de 5. Aquí solo se
 * cuenta lo que el backend manda, sin ninguna rama de rol propia.
 */
export function ProfileOnboardingCard() {
  const { data: steps, isLoading, isError } = useMyOnboarding();

  const total = steps?.length ?? 0;
  const completed = steps?.filter((step) => step.status === 'completed').length ?? 0;
  const allCompleted = total > 0 && completed === total;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Onboarding</CardTitle>
        <GraduationCap className={styles.headerIcon} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className={styles.empty}>Cargando tu progreso…</p>
        ) : isError || !steps ? (
          <p className={styles.empty}>No se ha podido cargar el estado de tu onboarding.</p>
        ) : total === 0 ? (
          <p className={styles.empty}>No tienes pasos de onboarding asignados.</p>
        ) : allCompleted ? (
          <div className={styles.completedRow}>
            <CheckCircle2 className={styles.completedIcon} />
            <span className={styles.completedLabel}>Onboarding completado</span>
          </div>
        ) : (
          <>
            <p className={styles.progressLabel}>
              <b>{completed}</b> de <b>{total}</b> pasos completados
            </p>
            <div className={styles.barTrack}>
              <div className={styles.barFill} style={{ width: `${progressPct}%` }} />
            </div>
            <p className={styles.detail}>{progressPct}% completado</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
