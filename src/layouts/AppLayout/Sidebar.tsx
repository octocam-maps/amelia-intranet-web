import { NavLink } from 'react-router-dom';
import logoBlanco from '@/assets/brand/logo-amelia-blanco.png';
import { useDashboardSummary } from '@/features/dashboard/application/useDashboardSummary';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { ADMIN_SECTION_ITEMS, NAV_BY_ROLE, type NavItem } from './nav-config';
import styles from './Sidebar.module.css';

/**
 * Navbar condicionado por rol — SOLO visual. La protección real de cada
 * módulo vive en el backend (`require_role`); ocultar aquí un ítem no
 * sustituye esa validación (docs/permisos-roles.md § "Reglas de implementación").
 */
export function Sidebar() {
  const role = useStore((s) => s.user?.role);
  const items = role ? NAV_BY_ROLE[role] : [];
  // Misma queryKey que `useDashboardSummary` de Inicio — TanStack Query
  // reutiliza la caché, no duplica la llamada a `/dashboard/summary`.
  const { data: summary } = useDashboardSummary();
  const pendingCount = summary?.pendingAbsenceRequests?.length;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoRow}>
        <img src={logoBlanco} alt="Amelia" className={styles.logo} />
      </div>

      <nav className={styles.nav}>
        {items.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}
      </nav>

      {role === 'administrador' && (
        <div className={styles.adminSection}>
          <p className={styles.adminLabel}>Administración</p>
          {ADMIN_SECTION_ITEMS.map((item) => (
            <NavItemLink
              key={item.to}
              item={item.label === 'Aprobar ausencias' ? { ...item, badgeCount: pendingCount } : item}
            />
          ))}
        </div>
      )}
    </aside>
  );
}

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <span className={styles.navItemDisabled} title="Disponible en una fase posterior">
        <Icon className={styles.navIcon} />
        {item.label}
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) => cn(styles.navItem, isActive && styles.navItemActive)}
    >
      <Icon className={styles.navIcon} />
      <span className={styles.navLabel}>{item.label}</span>
      {Boolean(item.badgeCount) && <span className={styles.navBadge}>{item.badgeCount}</span>}
    </NavLink>
  );
}
