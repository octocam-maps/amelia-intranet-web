import { Card, CardContent } from '@/components/ui/Card';
import { ProfileDetails } from '../components/ProfileDetails';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileOnboardingCard } from '../components/ProfileOnboardingCard';
import { ProfileQuickLinks } from '../components/ProfileQuickLinks';
import { ProfileVacationCard } from '../components/ProfileVacationCard';
import { useMyProfile } from '../application/useMyProfile';
import styles from './ProfilePage.module.css';

/**
 * docs/brief-diseno.md § C8 "Mi perfil" — ficha de SOLO LECTURA de
 * `GET /profile/me`. Sin formulario ni acciones de guardado: la edición de
 * datos personales queda fuera de esta iteración.
 *
 * Cada bloque (datos, onboarding, vacaciones, accesos) es una tarjeta
 * independiente con su propio estado de carga/vacío: si un hook falla (p.
 * ej. saldo de ausencias para un externo-invitado) esa tarjeta lo muestra
 * de forma honesta sin tumbar el resto de la página.
 */
export function ProfilePage() {
  const { data: profile, isLoading, isError } = useMyProfile();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mi perfil</h1>
        <p className={styles.subtitle}>Tus datos dentro de Amelia</p>
      </div>

      {isLoading ? (
        <p className={styles.empty}>Cargando perfil…</p>
      ) : isError || !profile ? (
        <p className={styles.empty}>No se ha podido cargar tu perfil. Inténtalo de nuevo más tarde.</p>
      ) : (
        <div className={styles.layout}>
          <ProfileHeader profile={profile} />

          <div className={styles.columns}>
            <div className={styles.mainColumn}>
              <Card>
                <CardContent>
                  <ProfileDetails profile={profile} />
                </CardContent>
              </Card>

              <ProfileQuickLinks role={profile.role} />
            </div>

            <div className={styles.sideColumn}>
              <ProfileOnboardingCard />
              <ProfileVacationCard />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
