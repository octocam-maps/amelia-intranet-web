import { NavLink } from 'react-router-dom';
import logoBlanco from '@/assets/brand/logo-amelia-blanco.png';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { ADMIN_SECTION, NAV_BY_ROLE, type NavItem } from './nav-config';

/**
 * Navbar condicionado por rol — SOLO visual. La protección real de cada
 * módulo vive en el backend (`require_role`); ocultar aquí un ítem no
 * sustituye esa validación (docs/permisos-roles.md § "Reglas de implementación").
 */
export function Sidebar() {
  const role = useStore((s) => s.user?.role);
  const items = role ? NAV_BY_ROLE[role] : [];

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-navy text-white">
      <div className="flex h-16 items-center px-6">
        <img src={logoBlanco} alt="Amelia" className="h-7 w-auto" />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {items.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}
      </nav>

      {role === 'administrador' && (
        <div className="border-t border-white/10 px-3 py-3">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-white/50">
            Administración
          </p>
          <NavItemLink item={ADMIN_SECTION} />
        </div>
      )}
    </aside>
  );
}

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  if (item.comingSoon) {
    return (
      <span
        className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-white/40"
        title="Disponible en una fase posterior"
      >
        <Icon className="h-4 w-4" />
        {item.label}
      </span>
    );
  }

  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/10',
          isActive ? 'bg-primary/15 text-primary' : 'text-white/80'
        )
      }
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </NavLink>
  );
}
