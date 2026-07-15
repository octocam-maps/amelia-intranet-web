import { Card, CardContent } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { useMyProfile } from '../application/useMyProfile';
import { ProfileDetails } from '../components/ProfileDetails';
import { ProfileHeader } from '../components/ProfileHeader';
import styles from './ProfilePage.module.css';

/**
 * docs/brief-diseno.md § C8 "Mi perfil" — ficha de SOLO LECTURA de
 * `GET /profile/me`. Sin formulario ni acciones de guardado: la edición de
 * datos personales queda fuera de esta iteración.
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
        <Card className={styles.card}>
          <CardContent className={styles.cardContent}>
            <ProfileHeader profile={profile} />
            <Separator />
            <ProfileDetails profile={profile} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
