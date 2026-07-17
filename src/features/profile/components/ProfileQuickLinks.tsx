import { ArrowTopRightIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { UserRole } from '@/features/auth/domain/models';
import { NAV_BY_ROLE } from '@/layouts/AppLayout/nav-config';
import { cn } from '@/lib/utils';
import styles from './ProfileQuickLinks.module.css';

// Subconjunto de módulos con sentido como "acceso rápido" desde el perfil —
// se excluyen "Inicio" (ya es la home) y "Mi perfil" (es esta misma
// página). El filtrado sobre `NAV_BY_ROLE[role]` hace que un
// externo-invitado (que solo tiene Onboarding + Equipo en su navbar) nunca
// vea aquí un módulo al que el backend le rechazaría el acceso.
const QUICK_ACCESS_ROUTES = new Set([
  '/ausencias',
  '/control-horario',
  '/equipo',
  '/onboarding',
  '/nominas',
  '/documentos',
]);

interface ProfileQuickLinksProps {
  role: UserRole;
}

export function ProfileQuickLinks({ role }: ProfileQuickLinksProps) {
  const items = NAV_BY_ROLE[role].filter((item) => QUICK_ACCESS_ROUTES.has(item.to));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accesos rápidos</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className={styles.empty}>No tienes módulos adicionales disponibles.</p>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => {
              const Icon = item.icon;
              if (item.comingSoon) {
                return (
                  <div
                    key={item.to}
                    className={cn(styles.tile, styles.tileDisabled)}
                    title="Disponible en una fase posterior"
                  >
                    <Icon className={styles.icon} />
                    <span className={styles.label}>{item.label}</span>
                    <span className={styles.soon}>Próximamente</span>
                  </div>
                );
              }
              return (
                <Link key={item.to} to={item.to} className={styles.tile}>
                  <Icon className={styles.icon} />
                  <span className={styles.label}>{item.label}</span>
                  <ArrowTopRightIcon className={styles.arrow} />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
