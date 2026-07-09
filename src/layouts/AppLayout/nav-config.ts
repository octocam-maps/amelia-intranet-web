import {
  Bell,
  CalendarClock,
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  Home,
  Inbox,
  Mailbox,
  Network,
  Tag,
  UserCircle,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/features/auth/domain/models';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Módulos aún sin página/ruta (llegan en fases posteriores) se muestran
   * deshabilitados en vez de ocultos, para que el mapa de navegación
   * completo sea visible desde el principio. */
  comingSoon?: boolean;
  /** Contador rojo (deck 02-home-admin) — solo "Aprobar ausencias" lo usa
   * hoy, con el total real de `dashboard/summary`. */
  badgeCount?: number;
}

const inicio: NavItem = { label: 'Inicio', to: '/', icon: Home };
// Fase 3: ausencias y control horario ya tienen página real — dejan de ser "comingSoon".
const ausencias: NavItem = { label: 'Ausencias', to: '/ausencias', icon: CalendarClock };
const controlHorario: NavItem = { label: 'Control horario', to: '/control-horario', icon: Clock };
const nominas: NavItem = { label: 'Nóminas', to: '/nominas', icon: Wallet, comingSoon: true };
const documentos: NavItem = { label: 'Documentos', to: '/documentos', icon: FileText, comingSoon: true };
const equipo: NavItem = { label: 'Equipo', to: '/equipo', icon: Users, comingSoon: true };
// Fase 6: el buzón anónimo del empleado ya tiene página real.
const buzonAnonimo: NavItem = { label: 'Buzón anónimo', to: '/buzon-anonimo', icon: Mailbox };
const perfil: NavItem = { label: 'Mi perfil', to: '/perfil', icon: UserCircle, comingSoon: true };
const onboarding: NavItem = { label: 'Onboarding', to: '/onboarding', icon: GraduationCap, comingSoon: true };

// docs/deck-fase3/02-home-admin-bandeja.png § sidebar — sección exclusiva
// del admin. "Aprobar ausencias" reutiliza la misma página de Ausencias
// (con la bandeja ya visible para su rol); el resto son módulos de fases
// posteriores (comingSoon), pero el LAYOUT completo se muestra desde ya.
// Fase 6 R1: "Plantilla" y "Buzón (recepción)" ya tienen página real.
export const ADMIN_SECTION_ITEMS: NavItem[] = [
  { label: 'Plantilla', to: '/administracion/plantilla', icon: Users },
  { label: 'Aprobar ausencias', to: '/ausencias', icon: Inbox },
  { label: 'Anuncios', to: '/administracion/anuncios', icon: Bell, comingSoon: true },
  { label: 'Buzón (recepción)', to: '/administracion/buzon', icon: Mailbox },
  { label: 'Onboarding', to: '/administracion/onboarding', icon: GraduationCap, comingSoon: true },
  { label: 'Festivos', to: '/administracion/festivos', icon: CalendarDays, comingSoon: true },
  { label: 'Tipos de ausencia', to: '/administracion/tipos-ausencia', icon: Tag, comingSoon: true },
  { label: 'Organigrama', to: '/administracion/organigrama', icon: Network, comingSoon: true },
];

// docs/permisos-roles.md § "Navbar por rol" — copiado literal, un ítem por rol.
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  empleado: [inicio, ausencias, controlHorario, nominas, documentos, equipo, buzonAnonimo, perfil],
  administrador: [inicio, ausencias, controlHorario, nominas, documentos, equipo, perfil],
  externo_invitado: [onboarding, equipo, perfil],
};
