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
// Fase 5: Equipo (directorio, calendario de vacaciones, organigrama) ya tiene
// página real. Fase 6: el buzón anónimo del empleado también. Ambos activos.
const equipo: NavItem = { label: 'Equipo', to: '/equipo', icon: Users };
const buzonAnonimo: NavItem = { label: 'Buzón anónimo', to: '/buzon-anonimo', icon: Mailbox };
// Fase 3: "Mi perfil" (ficha de solo lectura) ya tiene página real.
const perfil: NavItem = { label: 'Mi perfil', to: '/perfil', icon: UserCircle };
// Fase 2: onboarding ya tiene página real — deja de ser "comingSoon".
// docs/permisos-roles.md dice que el admin (único) "configura, ver
// Administración" en vez de recorrer el flujo — pero el contrato de
// backend consumido aquí incluye "administrador" en quiz/firma/perfil
// además de vídeo/manual, así que se muestra también en su navbar (ver
// engram: "Onboarding — nav por rol y contrato backend").
const onboarding: NavItem = { label: 'Onboarding', to: '/onboarding', icon: GraduationCap };

// docs/deck-fase3/02-home-admin-bandeja.png § sidebar — sección exclusiva
// del admin. "Aprobar ausencias" reutiliza la misma página de Ausencias
// (con la bandeja ya visible para su rol); el resto son módulos de fases
// posteriores (comingSoon), pero el LAYOUT completo se muestra desde ya.
// Fase 6 R1: "Plantilla" y "Buzón (recepción)" ya tienen página real.
// Fase 6 R2: "Anuncios", "Festivos" y "Tipos de ausencia" se suman.
export const ADMIN_SECTION_ITEMS: NavItem[] = [
  { label: 'Plantilla', to: '/administracion/plantilla', icon: Users },
  { label: 'Aprobar ausencias', to: '/ausencias', icon: Inbox },
  { label: 'Anuncios', to: '/administracion/anuncios', icon: Bell },
  { label: 'Buzón (recepción)', to: '/administracion/buzon', icon: Mailbox },
  { label: 'Onboarding', to: '/administracion/onboarding', icon: GraduationCap, comingSoon: true },
  { label: 'Festivos', to: '/administracion/festivos', icon: CalendarDays },
  { label: 'Tipos de ausencia', to: '/administracion/tipos-ausencia', icon: Tag },
  { label: 'Organigrama', to: '/administracion/organigrama', icon: Network, comingSoon: true },
];

// docs/permisos-roles.md § "Navbar por rol" — copiado literal, un ítem por rol.
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  empleado: [inicio, onboarding, ausencias, controlHorario, nominas, documentos, equipo, buzonAnonimo, perfil],
  administrador: [inicio, onboarding, ausencias, controlHorario, nominas, documentos, equipo, perfil],
  externo_invitado: [onboarding, equipo, perfil],
};
