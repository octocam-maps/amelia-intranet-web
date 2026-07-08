import {
  CalendarClock,
  Clock,
  FileText,
  GraduationCap,
  Home,
  Mailbox,
  ShieldCheck,
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
  /** Fase 1 solo construye "Inicio" — el resto llega en fases posteriores. */
  comingSoon?: boolean;
}

const inicio: NavItem = { label: 'Inicio', to: '/', icon: Home };
const ausencias: NavItem = { label: 'Ausencias', to: '/ausencias', icon: CalendarClock, comingSoon: true };
const controlHorario: NavItem = { label: 'Control horario', to: '/control-horario', icon: Clock, comingSoon: true };
const nominas: NavItem = { label: 'Nóminas', to: '/nominas', icon: Wallet, comingSoon: true };
const documentos: NavItem = { label: 'Documentos', to: '/documentos', icon: FileText, comingSoon: true };
const equipo: NavItem = { label: 'Equipo', to: '/equipo', icon: Users, comingSoon: true };
const buzonAnonimo: NavItem = { label: 'Buzón anónimo', to: '/buzon-anonimo', icon: Mailbox, comingSoon: true };
const perfil: NavItem = { label: 'Mi perfil', to: '/perfil', icon: UserCircle, comingSoon: true };
const onboarding: NavItem = { label: 'Onboarding', to: '/onboarding', icon: GraduationCap, comingSoon: true };

/** Exclusiva del admin (rol único) — se renderiza aparte, en su propia sección. */
export const ADMIN_SECTION: NavItem = {
  label: 'Administración',
  to: '/administracion',
  icon: ShieldCheck,
  comingSoon: true,
};

// docs/permisos-roles.md § "Navbar por rol" — copiado literal, un ítem por rol.
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  empleado: [inicio, ausencias, controlHorario, nominas, documentos, equipo, buzonAnonimo, perfil],
  administrador: [inicio, ausencias, controlHorario, nominas, documentos, equipo, perfil],
  externo_invitado: [onboarding, equipo, perfil],
};
