import type { RefObject } from 'react';
import { NavLink } from 'react-router-dom';
import logoBlanco from '@/assets/brand/logo-amelia-blanco.png';
import { useDashboardSummary } from '@/features/dashboard/application/useDashboardSummary';
import { useMailboxMessages } from '@/features/mailbox/application/useMailboxMessages';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { ADMIN_SECTION_ITEMS, NAV_BY_ROLE, type NavItem } from './nav-config';
import styles from './Sidebar.module.css';

interface SidebarProps {
  /** Móvil (`Sidebar.module.css`, <=768px): controla si el drawer está
   * desplegado. En escritorio no tiene ningún efecto (no hay media query
   * que lo consuma por fuera del breakpoint móvil). */
  isOpen: boolean;
  /** Permite a `AppLayout` mover el foco al primer enlace al abrir el
   * drawer. Prop normal (no `ref`) porque `Sidebar` no es un
   * `forwardRef` — React 18 no acepta `ref` como prop en componentes
   * de función planos. */
  navRef?: RefObject<HTMLElement>;
}

/**
 * Navbar condicionado por rol — SOLO visual. La protección real de cada
 * módulo vive en el backend (`require_role`); ocultar aquí un ítem no
 * sustituye esa validación (docs/permisos-roles.md § "Reglas de implementación").
 */
export function Sidebar({ isOpen, navRef }: SidebarProps) {
  const role = useStore((s) => s.user?.role);
  const isAdmin = role === 'administrador';
  const items = role ? NAV_BY_ROLE[role] : [];
  // Misma queryKey que `useDashboardSummary` de Inicio — TanStack Query
  // reutiliza la caché, no duplica la llamada a `/dashboard/summary`.
  const { data: summary } = useDashboardSummary();
  const pendingCount = summary?.pendingAbsenceRequests?.length;
  // Solo se consulta si el rol es admin — evita un 403 de más al resto de roles.
  const { data: unreadMessages } = useMailboxMessages('unread', isAdmin);
  const unreadCount = isAdmin ? unreadMessages?.length : undefined;

  const BADGE_COUNT_BY_LABEL: Record<string, number | undefined> = {
    'Aprobar ausencias': pendingCount,
    'Buzón (recepción)': unreadCount,
  };

  return (
    <aside ref={navRef} className={styles.sidebar} data-open={isOpen}>
      <div className={styles.logoRow}>
        <img src={logoBlanco} alt="Amelia" className={styles.logo} />
      </div>

      {/* Zona con scroll propio: garantiza que TODOS los ítems (incluida la
          sección Administración) sean alcanzables aunque no quepan en el
          alto del viewport. El logo queda fijo arriba. */}
      <div className={styles.scrollArea}>
        <nav className={styles.nav}>
          {items.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>

        {isAdmin && (
          <div className={styles.adminSection}>
            <p className={styles.adminLabel}>Administración</p>
            {ADMIN_SECTION_ITEMS.map((item) => (
              <NavItemLink
                key={item.to}
                item={{ ...item, badgeCount: BADGE_COUNT_BY_LABEL[item.label] ?? item.badgeCount }}
              />
            ))}
          </div>
        )}
      </div>
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
