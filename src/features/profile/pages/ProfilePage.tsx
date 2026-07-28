import { ProfileDetails } from '../components/ProfileDetails';
import { ProfileHeader } from '../components/ProfileHeader';
import { ProfileOnboardingCard } from '../components/ProfileOnboardingCard';
import { ProfileVacationCard } from '../components/ProfileVacationCard';
import { useMyProfile } from '../application/useMyProfile';
import styles from './ProfilePage.module.css';

/**
 * docs/brief-diseno.md § C8 "Mi perfil" — hero de identidad + dos columnas
 * asimétricas (60/40): a la izquierda los datos del empleado en dos tarjetas
 * (contacto, editable en teléfono y ciudad; laboral, de solo lectura), a la
 * derecha los widgets de estado (onboarding y vacaciones).
 *
 * Cada bloque es una tarjeta independiente con su propio estado de
 * carga/vacío: si un hook falla (p. ej. el saldo de ausencias de un
 * externo-invitado) esa tarjeta lo muestra de forma honesta sin tumbar el
 * resto de la página.
 *
 * Sin subtítulo bajo el topbar ("Tus datos dentro de Amelia" no añadía nada
 * al rótulo "Mi perfil" que ya pinta el topbar) y sin "Accesos rápidos": el
 * sidebar ya lleva a esos módulos, así que era un tercer camino al mismo
 * sitio.
 */
export function ProfilePage() {
  const { data: profile, isLoading, isError } = useMyProfile();

  return (
    <div className={styles.root}>
      {isLoading ? (
        <p className={styles.empty}>Cargando perfil…</p>
      ) : isError || !profile ? (
        <p className={styles.empty}>No se ha podido cargar tu perfil. Inténtalo de nuevo más tarde.</p>
      ) : (
        <div className={styles.layout}>
          <ProfileHeader profile={profile} />

          <div className={styles.columns}>
            <div className={styles.mainColumn}>
              {/* `ProfileDetails` ya trae sus dos tarjetas (contacto y
                  laboral); no se envuelve en una Card externa para no anidar
                  tarjeta dentro de tarjeta. */}
              <ProfileDetails profile={profile} />
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
